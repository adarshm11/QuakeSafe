from fastapi import FastAPI, UploadFile, File, Form
import uvicorn
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
        messages = [
            {
                'role': 'system',
                'content': [
                    {
                        'type': 'text',
                        'text': 'You are an assistant specialized in evaluating earthquake safety in urban environments. Your task is to assess uploaded city location images for potential earthquake-related risks. You will focus on obvious risks like falling debris, unstable structures, or blocked evacuation paths. For each image, provide short, clear bullet points with specific recommendations for improving safety. Limit your response to no more than 5 bullet points.'
                    },
                    {
                        'type': 'image',
                        'source': {
                            'type': 'url',
                            'url': image_url,
                        },
                    },
                ],
            }
        ]
    )
    return response.content[0].text

def calculate_safety_score():
    '''To-Do: implement algorithm to calculate safety score for homes, using gamified approach'''
    pass

@app.post('/analyze')
async def analyze(request: ImageUploadRequest):
    '''Endpoint to receive a file upload from the user, add to AWS S3 Bucket, and evaluate using Claude'''
    
    filename = await upload_to_s3(request.file) # name of file
    image_url = await generate_presigned_url(filename) # unique image url for AWS
    safety_analysis = await analyze_image_with_claude(image_url) # safety assessment of image
    supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)
    image_id = insert_image_entry(supabase_client, ImageUploadRequest.user_id, image_url, ImageUploadRequest.longitude, ImageUploadRequest.latitude)
    if not image_id:
        return {"Error": "Insertion into DB failed"}
    
    # calculate safety score, magnitude survivability
    safety_score, magnitude_survivability = 0
    response = insert_safety_assessment(supabase_client, image_id, safety_score, magnitude_survivability)
    if hasattr(response, 'error'):
        return {'error': response['error']}

    # if successful, return the analysis performed
    return {'analysis': safety_analysis}

if __name__ == '__main__':
    uvicorn.run('main:app', host='localhost', port=8000, reload=True)