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
                        'text': 'Analyze the image for earthquake safety risks and provide a safety score (0-100) and estimated magnitude survivability (e.g., "7.5").'
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
        safety_score_line = next(line for line in analysis.splitlines() if "Safety score:" in line)
        # Extract the number before the "/100" or any range
        safety_score_range = safety_score_line.split("Safety score:")[1].strip()
        if not safety_score_range:
            raise ValueError("Safety score is missing or incomplete in the response.")
        if "-" in safety_score_range:
            safety_score = float(safety_score_range.split("-")[1])  # Use the upper bound of the range
        else:
            safety_score = float(safety_score_range.split("/")[0])  # Extract the number before "/"
    except (StopIteration, ValueError, IndexError):
        raise ValueError("Failed to parse safety score from Claude AI response: " + analysis)

    # Parse the estimated magnitude survivability
    try:
        survivability_line = next(line for line in analysis.splitlines() if "Estimated magnitude survivability:" in line)
        estimated_magnitude_survivability = survivability_line.split("Estimated magnitude survivability:")[1].strip()
        if not estimated_magnitude_survivability or estimated_magnitude_survivability.endswith("-"):
            estimated_magnitude_survivability = None  # Default value if incomplete
        else:
            estimated_magnitude_survivability = float(estimated_magnitude_survivability)  # Convert to float
    except (StopIteration, ValueError, IndexError):
        estimated_magnitude_survivability = None  # Default value if missing

    return safety_score, estimated_magnitude_survivability

@app.post('/safety-assessment')
async def safety_assessment(file:UploadFile=File(...)):
    """Endpoint to upload an image, analyze it and give a safety assessment and store it in the database."""
    filename=await upload_to_s3(file)
    presigned_url=await generate_presigned_url(filename)

    safety_score,estimated_magnitude_survivability= await calculate_safety_score(presigned_url)
    image_id=str(uuid4())
    response=await create_safety_assessment(
        supabase=create_client(SUPABASE_URL, SUPABASE_KEY),
        image_id=image_id,
        safety_score=safety_score,
        estimated_magnitude_survivability=estimated_magnitude_survivability,
    )
    if(not response):
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