from dotenv import load_dotenv
import os
from supabase import Client
from uuid import uuid4

def check_if_user_exists(supabase:Client,user_id:str)->bool:
    response = supabase.from_('user_profiles').select('id').eq('id', user_id).limit(1).execute()
    return bool(response.data)

def insert_image_entry(supabase: Client, user_id: str, image_url: str, longitude: float, latitude: float, location_name: str = None):
    """Create a new image in the database."""
    data = {
        'user_id': user_id,
        'image_url': image_url,
        'longitude': longitude,
        'latitude': latitude,
        'location_name': location_name,
    }
    try: 
        response = supabase.from_('images').insert(data).execute()
        if hasattr(response, 'error'):
            error_msg = str(response['error'])
            print(f"Supabase error during insertion: {error_msg}")
            return False
        else:
            return response.data[0]['id']
    except Exception as e:
        print(f'Error during DB access: {e}')
        return False

def get_images_by_user(supabase: Client, user_id: str) :
    """Retrieve all images for a specific user."""
    response = supabase.from_('images').select('*').eq('user_id', user_id).execute()
    return response.data

def get_image_by_id(supabase: Client, image_id: str) :
    """Retrieve a specific image by its ID."""
    response = supabase.from_('images').select('*').eq('id', image_id).single().execute()
    return response.data

def insert_safety_assessment(supabase: Client, image_id: str, safety_score: float, 
                             estimated_magnitude_survivability: str, ) :
    """Create a new safety assessment record."""
    data = {
        "image_id": image_id,
        "safety_score": safety_score,
        "estimated_magnitude_survivability": estimated_magnitude_survivability,
        
    }
    try:
        response = supabase.from_('safety_assessments').insert(data).execute()
        return response.data
    except Exception as e:
        print(f'Error inserting into DB: {e}')
        return {'error': str(e)}


def insert_chat_message(supabase: Client, user_id: str, message_text: str, sender_type: str, chat_context: str, timestamp: str) -> dict:
    """Create a new chat message."""
    message_id = str(uuid4())
    data = {
        "id": message_id,
        "user_id": user_id,
        "message_text": message_text,
        "sender_type": sender_type,
        "chat_context": chat_context,
        "timestamp": timestamp
    }
    response = supabase.from_('chat_messages').insert(data).execute()
    return response.data

def get_chat_messages_by_user(supabase: Client, user_id: str) -> list:
    """Retrieve all chat messages for a specific user."""
    response = supabase.from_('chat_messages').select('*').eq('user_id', user_id).execute()
    return response.data

def insert_emergency_action(supabase: Client, user_id: str, action_taken: str) -> dict:
    """Create a new emergency action record."""
    action_id = str(uuid4())
    data = {
        "id": action_id,
        "user_id": user_id,
        "action_taken": action_taken
    }
    response = supabase.from_('emergency_actions').insert(data).execute()
    return response.data

def get_emergency_actions_by_user(supabase: Client, user_id: str) -> list:
    """Retrieve all emergency actions for a specific user."""
    response = supabase.from_('emergency_actions').select('*').eq('user_id', user_id).execute()
    return response.data