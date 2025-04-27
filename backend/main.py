from fastapi import FastAPI, UploadFile, File, Form, HTTPException
import uvicorn
import boto3
import anthropic
import uuid
from dotenv import load_dotenv
import os
from pydantic import BaseModel
from db.supabase_client import insert_image_entry, insert_safety_assessment, insert_chat_message
from supabase import create_client
from typing import Optional
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import io
from groq import Groq

app = FastAPI()
load_dotenv()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

S3_BUCKET = os.getenv('S3_BUCKET')
AWS_REGION = os.getenv('AWS_REGION')
CLAUDE_API_KEY = os.getenv('CLAUDE_API_KEY')
GROQ_API_KEY = os.getenv('GROQ_API_KEY')

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')

s3_client = boto3.client('s3', region_name=AWS_REGION)
claude_client = anthropic.Anthropic(api_key=CLAUDE_API_KEY)

async def upload_to_s3(file: UploadFile):
    '''Inserts a newly uploaded user image to the AWS S3 Bucket, returning its unique filename.'''

    # Generate a unique filename
    filename = f'{uuid.uuid4()}.jpg'
    s3_client.upload_fileobj(
        file.file,
        S3_BUCKET,
        filename,
        ExtraArgs={'ContentType': file.content_type, 'ACL': 'private'}  # ensure object is private
    )
    return filename

async def generate_unique_url(filename: str, expiration=3600) -> str:
    '''Generates a presigned URL for the specified file, allowing the Claude client to access the image.'''
    return s3_client.generate_presigned_url(
        'get_object',
        Params={'Bucket': S3_BUCKET, 'Key': filename},
        ExpiresIn=expiration
    )

async def generate_public_url(filename: str) -> str:
    return f"https://{S3_BUCKET}.s3.amazonaws.com/{filename}"

async def analyze_image_with_claude(image_url: str):
    '''Passes in the user image to the Claude AI agent for analysis, returning the analysis as a dict'''

    prompt = (
        "You are an earthquake safety specialist. "
        "Assess uploaded city images for earthquake risks: falling debris, unstable structures, blocked exits. "
        "For each image, list up to 3 short bullet points with specific safety improvements. "
        "Then give:\n\n"
        "- Description: (your 3 bullets in one line)\n"
        "- Score: (0–100 overall safety score)\n"
        "- Magnitude Survivability: (highest earthquake magnitude survivable, e.g., 7.5)\n\n"
        "Format your response exactly as shown, with no extra commentary."
    )

    try:
        print("[LOG] Creating Claude API request...")
        
        response = claude_client.messages.create(
            model='claude-3-5-haiku-20241022',
            max_tokens=200,
            system=prompt,  
            messages=[
                {
                    'role': 'user',
                    'content': [
                        {
                            'type': 'image',
                            'source': {
                                'type': 'url',
                                'url': image_url,
                            },
                        },
                        {
                            'type': 'text',
                            'text': "Analyze this image for earthquake safety risks."
                        }
                    ]
                }
            ]
        )
        print("[LOG] Claude API request completed")

        # Debug response
        print(f"[LOG] Claude response: {response}")
        
        # Check if response has content
        if not hasattr(response, 'content') or not response.content:
            print("[ERROR] No content in response from Claude API")
            return {"error": "No content returned from the Claude API."}

        # Get text from content
        response_text = response.content[0].text
        print(f"[LOG] Claude response text: {response_text}")

        # Parsing the response
        parsed_data = parse_claude_response(response_text)

        if not parsed_data:
            print("[ERROR] Failed to parse the response correctly")
            return {"error": "Failed to parse the Claude API response."}

        return parsed_data

    except Exception as e:
        print(f"[ERROR] Error occurred while analyzing image: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"error": f"An error occurred: {str(e)}"}


def parse_claude_response(response_text: str) -> dict:
    '''Parses the response from Claude and returns it in a structured dictionary'''

    
    # Handling unexpected or malformed response
    data = {}
    try:
        print(f"[PARSE_LOG] Processing text: {response_text}")
        lines = response_text.strip().splitlines()
        
        for line in lines:
            line = line.strip()
            # Use string.startswith() or string.find() instead of "contains"
            if line.startswith('Description:'):
                data['Description'] = line[len('Description:'):].strip()
                print(f"[PARSE_LOG] Found Description: {data['Description']}")
            elif line.startswith('Score:'):
                score_text = line[len('Score:'):].strip()
                # Handle different possible formats (e.g., "Score: 45/100")
                if '/' in score_text:
                    score_text = score_text.split('/')[0].strip()
                try:
                    data['Score'] = int(score_text)
                    print(f"[PARSE_LOG] Found Score: {data['Score']}")
                except ValueError:
                    # If we can't parse as int, store as string
                    data['Score'] = score_text
                    print(f"[PARSE_LOG] Found Score (not int): {data['Score']}")
            elif line.startswith('Magnitude Survivability:'):
                data['Magnitude Survivability'] = line[len('Magnitude Survivability:'):].strip()
                print(f"[PARSE_LOG] Found Magnitude: {data['Magnitude Survivability']}")
        
        # If the response is just a single line containing all information 
        # (like in your example "Description: Aging historic building...")
        if not data and len(lines) == 1:
            data['Description'] = lines[0]
            # Default values when we only have description
            data['Score'] = 0
            data['Magnitude Survivability'] = 'Unknown'
            print("[PARSE_LOG] Using single line as Description with default values")
        
        # If we fail to parse the expected keys, we return an empty dict
        if not data:
            print("[PARSE_LOG] No data found in response")
            raise ValueError("Parsed data is empty or incomplete.")
            
    except Exception as e:
        print(f"[ERROR] Error parsing Claude response: {str(e)}")
        return None

    print(f"[PARSE_LOG] Final parsed data: {data}")
    return data

@app.post('/analyze')
async def analyze(
    file: UploadFile = File(...),
    user_id: str = Form(...),
    longitude: Optional[float] = Form(None),
    latitude: Optional[float] = Form(None),
    location_name: Optional[str] = Form(None)
):
    '''Endpoint to receive a file upload from the user, add to AWS S3 Bucket, and evaluate using Claude'''
    try:
        print(f"[LOG] Request received - user_id: {user_id}, file: {file.filename}, content_type: {file.content_type}")
        print(f"[LOG] Location data - longitude: {longitude}, latitude: {latitude}, location_name: {location_name}")
        
        # Convert image to JPG format
        print("[LOG] Reading file contents...")
        contents = await file.read()
        print(f"[LOG] File read complete. Size: {len(contents)} bytes")
        
        # Convert to JPG using Pillow
        print("[LOG] Opening image with Pillow...")
        image = Image.open(io.BytesIO(contents))
        print(f"[LOG] Image opened. Mode: {image.mode}, Size: {image.size}")
        
        jpg_image = io.BytesIO()
        
        # If image is not RGB (like PNG with transparency), convert it
        if image.mode != 'RGB':
            print(f"[LOG] Converting image from {image.mode} to RGB mode")
            image = image.convert('RGB')
            
        # Save as JPEG format with 90% quality
        print("[LOG] Saving image as JPEG...")
        image.save(jpg_image, format='JPEG', quality=90)
        jpg_image.seek(0)
        print(f"[LOG] JPEG conversion complete. Size: {jpg_image.getbuffer().nbytes} bytes")
        
        # Skip converting to UploadFile, upload directly to S3
        print("[LOG] Preparing for S3 upload...")
        filename = f"{uuid.uuid4()}.jpg"
        print(f"[LOG] Generated filename: {filename}")
        
        # Upload directly to S3 instead of using UploadFile
        print("[LOG] Uploading file to S3...")
        s3_client.upload_fileobj(
            jpg_image,
            S3_BUCKET,
            filename,
            ExtraArgs={'ContentType': 'image/jpeg'}
        )
        print(f"[LOG] S3 upload complete. Filename: {filename}")
        
        # Generate URL for the uploaded image
        print("[LOG] Generating presigned URL...")
        image_url = await generate_unique_url(filename)
        print(f"[LOG] URL generated. Length: {len(image_url)}")
        save_image_url = await generate_public_url(filename)
        print(f"[LOG] Public URL generated. Length: {len(save_image_url)}")
        
        # Analyze the image with Claude
        print("[LOG] Sending image to Claude for analysis...")
        image_analysis = await analyze_image_with_claude(image_url)
        print(f"[LOG] Claude analysis complete: {image_analysis}")
        
        # Parse coordinates if provided
        print("[LOG] Processing location data...")
        lat = float(latitude) if latitude is not None else None
        lng = float(longitude) if longitude is not None else None
        print(f"[LOG] Processed location - lat: {lat}, lng: {lng}")
        
        # Insert the data into Supabase
        print("[LOG] Creating Supabase client...")
        supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)
        print("[LOG] Inserting image entry into database...")
        image_id = insert_image_entry(supabase_client, user_id, save_image_url, lng, lat, location_name)
        print(f"[LOG] Image entry inserted with ID: {image_id}")
        
        if not image_id:
            print("[ERROR] Failed to insert image into database")
            raise HTTPException(status_code=500, detail="Insertion into DB failed")
        
        if "error" in image_analysis:
            print(f"[ERROR] Analysis error: {image_analysis['error']}")
            return {"error": image_analysis["error"]}
        
        # Extract analysis data
        print("[LOG] Extracting analysis data...")
        description = image_analysis.get('Description', '')
        safety_score = image_analysis.get('Score', 0)
        magnitude_survivability = image_analysis.get('Magnitude Survivability', '')
        print(f"[LOG] Extracted data - score: {safety_score}, survivability: {magnitude_survivability}")
        
        # Insert safety assessment
        print("[LOG] Inserting safety assessment into database...")
        response = insert_safety_assessment(
            supabase_client, 
            image_id, 
            safety_score, 
            magnitude_survivability, 
            description
        )
        print(f"[LOG] Safety assessment insertion response: {response}")
        
        if isinstance(response, dict) and "error" in response:
            print(f"[ERROR] Safety assessment insertion failed: {response['error']}")
            return {'error': response['error']}
            
        # Return successful analysis
        print("[LOG] Request completed successfully")
        return {'analysis': image_analysis}
        
    except Exception as e:
        print(f"[ERROR] Error processing upload: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error processing upload: {str(e)}")
    
@app.get('/images')
async def get_all_images():
    """Endpoint to retrieve all images with location data"""
    print("[LOG] Request received - getting all images")
    
    try:
        print("[LOG] Creating Supabase client...")
        supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)
        print("[LOG] Supabase client created successfully")
        
        print("[LOG] About to call fetch_all_images...")
        images = fetch_all_images(supabase_client)
        print("[LOG] fetch_all_images returned data type:", type(images))
        
        print(f"[LOG] Found {len(images)} images")
        if images and len(images) > 0:
            print("[LOG] First image sample:", images[0])
        
        print("[LOG] Returning response")
        return {'images': images}
        
    except Exception as e:
        print(f"[ERROR] Error retrieving images: {str(e)}")
        print(f"[ERROR] Error type: {type(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error retrieving images: {str(e)}")

@app.get('/image/{image_id}')
async def get_image(image_id: str):
    """Endpoint to retrieve a specific image by its ID"""
    try:
        print(f"[LOG] Request received - getting image with ID: {image_id}")
        
        # Create Supabase client
        supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)
        
        # Get the image data
        image_data = get_image_by_id(supabase_client, image_id)
        if not image_data:
            print(f"[ERROR] Image with ID {image_id} not found")
            raise HTTPException(status_code=404, detail="Image not found")
        
        print(f"[LOG] Found image: {image_data['id']}")
        
        # Return the image data
        return {'image': image_data}
        
    except Exception as e:
        print(f"[ERROR] Error retrieving image: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error retrieving image: {str(e)}")

@app.get('/safety_assessments/{image_id}')
async def get_safety_assessments(image_id: str):
    """Endpoint to retrieve all safety assessments for a specific image"""
    try:
        print(f"[LOG] Request received - getting safety assessments for image with ID: {image_id}")
        
        # Create Supabase client
        supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)
        
        # Get the image data
        safety_assessments = get_safety_assessments_by_image(supabase_client, image_id)
        if not safety_assessments:
            print(f"[ERROR] Safety assessments not found for image with ID {image_id}")
            raise HTTPException(status_code=404, detail="Safety assessments not found")
        
        print(f"[LOG] Found safety assessments: {safety_assessments}")
        
        # Return the safety assessments data
        return {'safety_assessments': safety_assessments}
        
    except Exception as e:
        print(f"[ERROR] Error retrieving safety assessments: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error retrieving safety assessments: {str(e)}")

class ChatRequest(BaseModel):
    user_id: str
    prompt: str

@app.post("/chat")
async def process_chatbot(request: ChatRequest):
    """
    Endpoint to handle chat prompts and return structured responses from Groq AI.
    """
    print('reached endpoint')
    try:
        groq_client = Groq(api_key=GROQ_API_KEY)
        chat_completions = groq_client.chat.completions.create(
            messages=[
                {
                    'role': 'system',
                    'content': (
                        "You are a helpful and knowledgeable assistant specializing in earthquake safety. "
                        "When answering the user's question, also determine if their question relates to "
                        "'before', 'during', or 'after' an earthquake. "
                        "At the end of your reply, output your answer clearly in the format:\n\n"
                        "Timing: <before/during/after>"
                        "Do not include any kind of bold, italic, or different sized text in your response."
                    ),
                },
                {
                    'role': 'user',
                    'content': request.prompt,
                }
            ],
            model="llama-3.3-70b-versatile",
            max_tokens=300,
        )
        
        print('response received')
        # parse the JSON output correctly
        response = chat_completions.choices[0].message.content
        print('response grabbed')
        ai_response, context = response.split('\n\nTiming:')
        ai_response = ai_response.strip()
        context = context.strip()
        print('response split')
        
        # insert the log of this chat interaction to the database
        supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)
        db_response = insert_chat_message(supabase_client, request.user_id, request.prompt, ai_response, context) # figure out how to establish context
        
        print('inserted into db')
        return {'ai_response': ai_response, 'context': context}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == '__main__':
    uvicorn.run('main:app', host='0.0.0.0', port=8000, reload=True)