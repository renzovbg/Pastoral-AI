import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
# Preferir Service Role no backend (bypass RLS); senão usar anon key
SUPABASE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY", "")

def get_supabase() -> Client:
    return create_client(SUPABASE_URL, SUPABASE_KEY)
