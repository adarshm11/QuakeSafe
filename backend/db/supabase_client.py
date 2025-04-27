from supabase import Client
from datetime import datetime

def check_if_user_exists(supabase: Client, user_id: str) -> bool | None:
    try:
        response = supabase.from_('user_profiles').select('id').eq('id', user_id).limit(1).execute()
        if hasattr(response, 'error') and response.error:
            print(f'Error checking DB: {str(response.error)}')
            return None
        return True if response.data else False
    except Exception as e:
        print(f'Error accessing DB: {e}')
        return None

def insert_image_entry(supabase: Client, user_id: str, image_url: str, longitude: float, latitude: float, location_name: str = None) -> str | None:
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
        if hasattr(response, 'error') and response.error:
            print(f'Error inserting into DB: {str(response.error)}')
            return None
        else:
            return response.data[0]['id'] # return user_id of the user that inserted the image -> multifunctional
    except Exception as e:
        print(f'Error accessing DB: {e}')
        return None

def get_images_by_user(supabase: Client, user_id: str):
    """Retrieve all images for a specific user."""
    try: 
        response = supabase.from_('images').select('*').eq('user_id', user_id).execute()
        if hasattr(response, 'error') and response.error:
            print(f'Error retrieving from DB: {str(response.error)}')
            return None
        return response.data
    except Exception as e:
        print(f'Error accessing DB: {e}')
        return None

def get_image_by_id(supabase: Client, image_id: str):
    """Retrieve a specific image by its ID."""
    try:
        response = supabase.from_('images').select('*').eq('id', image_id).single().execute()
        if hasattr(response, 'error') and response.error:
            print(f'Error retrieving from DB: {str(response.error)}')
            return None
        return response.data
    except Exception as e:
        print(f'Error accessing DB: {e}')
        return None

def fetch_all_images(supabase: Client):
    """Retrieve all images with location data."""
    try:
        response = supabase.from_('images').select('*').execute()
        
        # Check for errors in the response
        if hasattr(response, 'error') and response.error:
            print(f"Error fetching images: {response.error}")
            return []
        else:
            print(f"Fetched data: {len(response.data)} records")
            return response.data
    except Exception as e:
        print(f"Exception in fetch_all_images: {str(e)}")
        return []


def insert_safety_assessment(supabase: Client, image_id: str, safety_score: float, 
                             estimated_magnitude_survivability: str, description: str):
    """Create a new safety assessment record."""
    data = {
        "image_id": image_id,
        "safety_score": safety_score,
        "estimated_magnitude_survivability": estimated_magnitude_survivability,
        "description": description
    }

    try:
        response = supabase.from_('safety_assessments').insert(data).execute()
        if hasattr(response, 'error') and response.error:
            print(f'Error inserting into DB: {str(response.error)}')
            return None
        return response.data
    except Exception as e:
        print(f'Error accessing DB: {e}')
        return None

def insert_chat_message(supabase: Client, user_id: str, user_message: str, ai_response: str, chat_context: str, 
                        timestamp: str = str(datetime.now())) -> dict:
    """Create a new chat message."""
    data = {
        "user_id": user_id,
        "user_message": user_message,
        "ai_response": ai_response,
        "chat_context": chat_context,
        "timestamp": timestamp
    }
    try:
        response = supabase.from_('chat_messages').insert(data).execute()
        if hasattr(response, 'error') and response.error:
            print(f'Error inserting into DB: {str(response.error)}')
            return None
        return response.data
    except Exception as e:
        print(f'Error accessing DB: {e}')
        return None

def get_chat_messages_by_user(supabase: Client, user_id: str) -> list:
    """Retrieve all chat messages for a specific user."""
    try:
        response = supabase.from_('chat_messages').select('*').eq('user_id', user_id).execute()
        if hasattr(response, 'error') and response.error:
            print(f'Error retrieving from DB: {str(response.error)}')
            return None
        return response.data
    except Exception as e:
        print(f'Error accessing DB: {e}')
        return None

def insert_emergency_action(supabase: Client, user_id: str, action_taken: str) -> dict:
    """Create a new emergency action record."""
    data = {
        "user_id": user_id,
        "action_taken": action_taken
    }
    try:
        response = supabase.from_('emergency_actions').insert(data).execute()
        if hasattr(response, 'error') and response.error:
            print(f'Error inserting into DB: {str(response.error)}')
            return None
        return response.data
    except Exception as e:
        print(f'Error accessing DB: {e}')
        return None

def get_emergency_actions_by_user(supabase: Client, user_id: str) -> list:
    """Retrieve all emergency actions for a specific user."""
    try:
        response = supabase.from_('emergency_actions').select('*').eq('user_id', user_id).execute()
        if hasattr(response, 'error') and response.error:
            print(f'Error retrieving from DB: {str(response.error)}')
            return None
        return response.data
    except Exception as e:
        print(f'Error accessing DB: {e}')
        return None