from fastapi import FastAPI, UploadFile, File, Form
import uvicorn
from uuid import uuid4
import boto3
import anthropic
import uuid
from dotenv import load_dotenv
import os
from pydantic import BaseModel
from db.supabase_client import insert_image_entry, insert_safety_assessment
from supabase import create_client
from typing import Optional

app = FastAPI()
load_dotenv()

S3_BUCKET = os.getenv('S3_BUCKET')
AWS_REGION = os.getenv('AWS_REGION')
CLAUDE_API_KEY = os.getenv('CLAUDE_API_KEY')
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')

s3_client = boto3.client('s3', region_name=AWS_REGION)
claude_client = anthropic.Anthropic(api_key=CLAUDE_API_KEY)

class ImageUploadRequest(BaseModel):
    user_id: str = Form(None)
    file: UploadFile = File(...)
    longitude: float = Form(None)
    latitude: float = Form(None)
    location_name: Optional[str] = Form(None)

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

async def generate_unique_url(filename: str, expiration=300):
    '''Generates a URL for the specified file, allowing the Claude client to access the image.'''

    return s3_client.generate_presigned_url(
        'get_object',
        Params={'Bucket': S3_BUCKET, 'Key': filename},
        ExpiresIn=expiration,
    )

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
        # Sending the request to Claude AI
        response = claude_client.messages.create(
            model='claude-3-5-sonnet-20250219',
            max_tokens=200,
            messages=[
                {
                    'role': 'system',
                    'content': prompt,
                },
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
                            'text': "Analyze this image for earthquake safety risks based on the system instructions."
                        }
                    ]
                }
            ]
        )

        # Check if response is valid
        if 'content' not in response or not response.content:
            print("No content in response from Claude API.")
            return {"error": "No content returned from the Claude API."}

        # Parsing the response
        parsed_data = parse_claude_response(response.content[0].text)

        if not parsed_data:
            print("Failed to parse the response correctly.")
            return {"error": "Failed to parse the Claude API response."}

        return parsed_data

    except Exception as e:
        print(f"Error occurred while analyzing image: {str(e)}")
        return {"error": f"An error occurred: {str(e)}"}


def parse_claude_response(response_text: str) -> dict:
    '''Parses the response from Claude and returns it in a structured dictionary'''
    
    # Handling unexpected or malformed response
    data = {}
    try:
        lines = response_text.strip().splitlines()

        for line in lines:
            if line.startswith('Description:'):
                data['Description'] = line.split('Description:')[1].strip()
            elif line.startswith('Score:'):
                data['Score'] = int(line.split('Score:')[1].strip())
            elif line.startswith('Magnitude Survivability:'):
                data['Magnitude Survivability'] = line.split('Magnitude Survivability:')[1].strip()

        # If we fail to parse the expected keys, we return an empty dict
        if not data:
            raise ValueError("Parsed data is empty or incomplete.")
        
    except Exception as e:
        print(f"Error parsing Claude response: {str(e)}")
        return None

    return data

@app.post('/analyze')
async def analyze(request: ImageUploadRequest):
    '''Endpoint to receive a file upload from the user, add to AWS S3 Bucket, and evaluate using Claude'''
    
    filename = await upload_to_s3(request.file) # name of file
    image_url = await generate_unique_url(filename) # unique image url for AWS
    image_analysis = await analyze_image_with_claude(image_url) # safety assessment of image
    supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)
    image_id = insert_image_entry(supabase_client, ImageUploadRequest.user_id, image_url, ImageUploadRequest.longitude, ImageUploadRequest.latitude)
    if not image_id:
        return {"Error": "Insertion into DB failed"}
    
    if hasattr(image_analysis, 'error'):
        return {'error', image_analysis['error']}
    else:
        description = image_analysis['Description']
        safety_score = image_analysis['Score']
        magnitude_survivability = image_analysis['Magnitude Survivability']
    response = insert_safety_assessment(supabase_client, image_id, safety_score, magnitude_survivability, description)
    if hasattr(response, 'error'):
        return {'error': response['error']}

    # if successful, return the analysis performed
    return {'analysis': image_analysis}

if __name__ == '__main__':
    uvicorn.run('main:app', host='localhost', port=8000, reload=True)