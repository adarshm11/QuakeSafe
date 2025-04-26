from dotenv import load_dotenv
import os
from supabase import Client
from uuid import uuid4

def check_if_user_exists(supabase:Client,user_id:str)->bool:
    response = supabase.from_('user_profiles').select('id').eq('id', user_id).limit(1).execute()
    return bool(response.data)

def create_image(supabase:Client,user_id:str,image_url:str,room_name:str=None):
    """Create a new image in the database."""
    image_id = str(uuid4())
    data = {
        'id': image_id,
        'user_id': user_id,
        'image_url': image_url,
        'room_name': room_name
    }
    response = supabase.from_('images').insert(data).execute()
    return response.data

def get_images_by_user(supabase: Client, user_id: str) -> list:
    """Retrieve all images for a specific user."""
    response = supabase.from_('images').select('*').eq('user_id', user_id).execute()
    return response.data

def get_image_by_id(supabase: Client, image_id: str) -> dict:
    """Retrieve a specific image by its ID."""
    response = supabase.from_('images').select('*').eq('id', image_id).single().execute()
    return response.data

def create_safety_assessment(supabase: Client, image_id: str, safety_score: float, potential_damage_cost_usd: float,
                             estimated_magnitude_survivability: str, recommendations: list, risky_items: list) -> dict:
    """Create a new safety assessment record."""
    assessment_id = str(uuid4())
    data = {
        "id": assessment_id,
        "image_id": image_id,
        "safety_score": safety_score,
        "potential_damage_cost_usd": potential_damage_cost_usd,
        "estimated_magnitude_survivability": estimated_magnitude_survivability,
        "recommendations": recommendations,
        "risky_items": risky_items
    }
    response = supabase.from_('safety_assessments').insert(data).execute()
    return response.data

def get_safety_assessments_by_image(supabase: Client, image_id: str) -> list:
    """Retrieve all safety assessments for a specific image."""
    response = supabase.from_('safety_assessments').select('*').eq('image_id', image_id).execute()
    return response.data

def create_location_risk_data(supabase: Client, user_id: str, earthquake_risk_level: str, zone_code: str) -> dict:
    """Create a new location risk data record."""
    risk_data_id = str(uuid4())
    data = {
        "id": risk_data_id,
        "user_id": user_id,
        "earthquake_risk_level": earthquake_risk_level,
        "zone_code": zone_code
    }
    response = supabase.from_('location_risk_data').insert(data).execute()
    return response.data

def get_location_risk_data_by_user(supabase: Client, user_id: str) -> list:
    """Retrieve location risk data for a specific user."""
    response = supabase.from_('location_risk_data').select('*').eq('user_id', user_id).execute()
    return response.data

def create_chat_message(supabase: Client, user_id: str, message_text: str, sender_type: str, chat_context: str, timestamp: str) -> dict:
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

def create_emergency_action(supabase: Client, user_id: str, action_taken: str) -> dict:
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