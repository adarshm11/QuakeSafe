from fastapi import FastAPI, UploadFile, File
import uvicorn
import boto3
import anthropic
import uuid
from dotenv import load_dotenv
import os
from pydantic import BaseModel
import db.supabase_client
# import helper methods from supabase client

app = FastAPI()
load_dotenv()

S3_BUCKET = os.getenv('S3_BUCKET')
AWS_REGION = os.getenv('AWS_REGION')
CLAUDE_API_KEY = os.getenv('CLAUDE_API_KEY')

s3_client = boto3.client('s3', region_name=AWS_REGION)
claude_client = anthropic.Anthropic(api_key=CLAUDE_API_KEY)

class Request(BaseModel):
    user_id: str
    file: UploadFile = File(...)


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
async def analyze(request: Request):
    '''Endpoint to receive a file upload from the user, add to AWS S3 Bucket, and evaluate using Claude'''
    
    filename = await upload_to_s3(request.file)
    presigned_url = await generate_presigned_url(filename)
    analysis = await analyze_image_with_claude(presigned_url)
    # input the url, image name, and analysis to the supabase db
    return {'analysis': analysis}

if __name__ == '__main__':
    uvicorn.run('main:app', host='localhost', port=8000, reload=True)