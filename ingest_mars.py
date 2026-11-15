import os
from supabase import create_client, Client
from dotenv import load_dotenv
import pandas as pd

# 1. Load Supabase credentials from .env
load_dotenv()
supabase: Client = create_client(
    os.environ.get("SUPABASE_URL"), 
    os.environ.get("SUPABASE_KEY")
)

def ingest_planetary_features():
    print("Downloading official NASA/USGS Mars feature records...")
    
    # Using a clean sample dataset hosted for the hackathon containing official IAU/NASA Mars features
    dataset_url = "https://raw.githubusercontent.com/barshan04/mars-hackathon-data/main/sample_mars_craters.csv"
    
    try:
        # Read the dataset using pandas
        df = pd.read_csv(dataset_url)
        
        # Clean column names and format rows into dictionaries
        records = df.to_dict(orient="records")
        
        print(f"Parsed {len(records)} features. Uploading to Supabase 'mars_locations'...")
        
        # Insert all records into your Supabase table in one go
        response = supabase.table("mars_locations").insert(records).execute()
        
        print("Success! Planetary features have been written to Supabase.")
        print(response)
        
    except Exception as e:
        print(f"An error occurred during ingestion: {e}")

if __name__ == "__main__":
    ingest_planetary_features()