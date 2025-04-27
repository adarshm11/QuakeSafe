from fastapi import FastAPI, UploadFile, File
from db.supabase_client import check_if_user_exists,create_chat_message,get_emergency_actions_by_user,create_emergency_action,get_chat_messages_by_user,create_location_risk_data,get_location_risk_data_by_user,create_safety_assessment,get_safety_assessments_by_image
from supabase import create_client
import uvicorn
from uuid import uuid4
import boto3
import anthropic
import uuid
from dotenv import load_dotenv
import os
# import helper methods from supabase client

app = FastAPI()
load_dotenv()

S3_BUCKET = os.getenv('S3_BUCKET')
AWS_REGION = os.getenv('AWS_REGION')
CLAUDE_API_KEY = os.getenv('CLAUDE_API_KEY')

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')

s3_client = boto3.client('s3', region_name=AWS_REGION)
claude_client = anthropic.Anthropic(api_key=CLAUDE_API_KEY)

@app.post('/upload')
async def upload_to_s3(file: UploadFile):
    '''Inserts a newly uploaded user image to the AWS S3 Bucket, returning its unique filename.'''
    print('Reached into upload endpoint')

    # Generate a unique filename
    filename = f'{uuid.uuid4()}.jpg'
    print('Filename generated')
    s3_client.upload_fileobj(
        file.file,
        S3_BUCKET,
        filename,
        ExtraArgs={'ContentType': file.content_type, 'ACL': 'private'}  # ensure object is private
    )
    print('upload complete')
    return filename

async def generate_presigned_url(filename: str, expiration=300):
    '''Generates a URL for the specified file, allowing the Claude client to access the image.'''

    return s3_client.generate_presigned_url(
        'get_object',
        Params={'Bucket': S3_BUCKET, 'Key': filename},
        ExpiresIn=expiration,
    )

async def analyze_image_with_claude(image_url: str):
    '''Passes in the user image to the Claude AI agent for analysis, returning the analysis'''

    response = claude_client.messages.create(
        model='claude-3-7-sonnet-20250219',
        max_tokens=200,
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
                        'text': 'Please evaluate the uploaded city location image for earthquake safety issues. Focus on obvious risks like falling debris, unstable structures, or blocked evacuation paths. Provide short, clear bullet points with specific recommendations. Limit your response to 5 bullet points or fewer.'
                    }
                ],
            }
        ],
    )
    return response.content[0].text

def calculate_safety_score(image_url:str):
    '''To-Do: implement algorithm to calculate safety score for homes, using gamified approach'''
    response=claude_client.messages.create(
        model='claude-3-7-sonnet-20250219',
        max_tokens=200,
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
                        'text': 'Analyze the image for earthquake safety risks and provide a safety score (0-100) and estimated magnitude survivability (e.g., "7.5"), and a summary of safety features and potential concerns.'
                    }
                ],
            }
        ],
        
    )
    if(not response):
        return {'error': 'Failed to analyze image.'}
    analysis= response.content[0].text
    print("Calude AI Response: ", analysis)

        # Parse the safety score
    try:
        normalized_analysis = "\n".join(line.strip("*").lower() for line in analysis.splitlines())
        safety_score_line = next(line for line in normalized_analysis.splitlines() if "safety score" in line)
        safety_score_range = safety_score_line.split(":")[1].strip()
        # Extract the number before "/100"
        safety_score = float(safety_score_range.split("/")[0].strip())
    except (StopIteration, ValueError, IndexError):
        raise ValueError("Failed to parse safety score from Claude AI response: " + analysis)

    # Parse the estimated magnitude survivability
    try:
        survivability_line = next(line for line in normalized_analysis.splitlines() if "estimated magnitude survivability" in line)
        survivability_value = survivability_line.split(":")[1].strip()
        # Remove stars and handle ranges like "7.0-7.5" by extracting the upper bound
        survivability_value = survivability_value.replace("*", "").strip()
        if "-" in survivability_value:
            estimated_magnitude_survivability = float(survivability_value.split("-")[1].strip())
        else:
            estimated_magnitude_survivability = float(survivability_value)
    except (StopIteration, ValueError, IndexError):
        estimated_magnitude_survivability = None # Default value if parsing fails
    
    try:
        safety_features_start = analysis.lower().find("### safety features")
        potential_concerns_start = analysis.lower().find("### potential concerns")
        
        if safety_features_start != -1 and potential_concerns_start != -1:
            # Extract the "Safety Features" section
            safety_features = analysis[safety_features_start:potential_concerns_start].strip()
            
            # Extract the "Potential Concerns" section
            potential_concerns = analysis[potential_concerns_start:].strip()
            
            # Format the description
            description = f"{safety_features}\n\n{potential_concerns}"
        else:
            description = "No detailed safety features or concerns found in the analysis."
    except Exception as e:
        print(f"Warning: Failed to generate description. Error: {e}")
        description = "No detailed safety features or concerns found in the analysis."

    print("Safety Score(line 134): ", safety_score)
    print("Estimated Magnitude Survivability line 135: ", estimated_magnitude_survivability)
    print("Description: ", description)

    return safety_score, estimated_magnitude_survivability, description

@app.post('/safety-assessment')
async def safety_assessment(file:UploadFile=File(...)):
    """Endpoint to upload an image, analyze it and give a safety assessment and store it in the database."""
    filename=await upload_to_s3(file)
    presigned_url=await generate_presigned_url(filename)

    safety_score,estimated_magnitude_survivability,description= calculate_safety_score(presigned_url)
    image_id=str(uuid4())
    response=await create_safety_assessment(
        supabase=create_client(SUPABASE_URL, SUPABASE_KEY),
        image_id=image_id,
        safety_score=safety_score,
        estimated_magnitude_survivability=estimated_magnitude_survivability,
        description=description
    )
    print("Response from Supabase: ", response) 
    if(not response):
        print("Error: Failed to create safety assessment in Supabase.")

        return {'error': 'Failed to create safety assessment.'}
    
    return {
        'image_id': image_id,
        'safety_score': safety_score,
        'estimated_magnitude_survivability': estimated_magnitude_survivability,
        'supabase_response': response
    }

@app.post('/analyze')
async def analyze(file: UploadFile = File(...)):
    '''Endpoint to receive a file upload from the user, add to AWS S3 Bucket, and evaluate using Claude'''
    
    filename = await upload_to_s3(file)
    presigned_url = await generate_presigned_url(filename)
    analysis = await analyze_image_with_claude(presigned_url)
    return {'analysis': analysis}

if __name__ == '__main__':
    uvicorn.run('main:app', host='localhost', port=8000, reload=True)