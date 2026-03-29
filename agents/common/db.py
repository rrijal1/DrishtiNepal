"""
Drishti Nepal - Common Database Client
Wraps Supabase client for all agent operations.
"""

import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()


def get_supabase_client() -> Client:
    url = os.environ.get("SUPABASE_URL", "")
    key = os.environ.get("SUPABASE_SERVICE_KEY", "")
    if not url or not key:
        return None
    return create_client(url, key)


db = get_supabase_client()
