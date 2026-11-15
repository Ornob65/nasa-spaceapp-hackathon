import os
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client
from dotenv import load_dotenv

# Load your Supabase environment variables
load_dotenv()

app = FastAPI()

# Allow your frontend to communicate with this server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Missing Supabase credentials in environment variables.")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

@app.get("/api/mars-locations")
def get_mars_locations(search: str = Query(None, description="Search term for landmark name")):
    try:
        # Start building the Supabase query
        query = supabase.table("mars_locations").select("*")
        
        # If a search term was provided, filter case-insensitively by name
        if search:
            query = query.ilike("name", f"%{search}%")
            
        response = query.execute()
        return {"success": True, "data": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    # Starts the local server on port 8000
    uvicorn.run("server:app", host="127.0.0.1", port=8000, reload=True)