import os
from supabase import create_client, Client
from dotenv import load_dotenv

# 1. Load environment variables from the .env file
load_dotenv()

# 2. Retrieve Supabase URL and Key from environment
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

# Basic validation to ensure credentials exist
if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Missing Supabase credentials. Make sure your .env file is set up correctly.")

# 3. Initialize the Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def test_supabase_connection():
    print("Connecting to Supabase...")
    try:
        # Perform a quick, lightweight query to verify the connection works
        response = supabase.table("mars_locations").select("count", count="exact").execute()
        print("Successfully connected to Supabase!")
        print(f"Current record count in 'mars_locations': {response.count}")
    except Exception as e:
        print(f"Failed to connect to Supabase: {e}")

if __name__ == "__main__":
    test_supabase_connection()