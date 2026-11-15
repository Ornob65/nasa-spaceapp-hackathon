import os
from supabase import create_client, Client
from dotenv import load_dotenv
import pandas as pd

# 1. Load environment variables from .env
load_dotenv()
supabase: Client = create_client(
    os.environ.get("SUPABASE_URL"), 
    os.environ.get("SUPABASE_KEY")
)

def bulk_ingest_nasa_data():
    print("Fetching bulk Mars planetary data from repository source...")
    
    # Public open-source dataset URL mapping verified Mars surface features & coordinates
    dataset_url = "https://raw.githubusercontent.com/wmgeolab/cs571-s21/main/hw3/mars_craters.csv"
    
    try:
        # Read the remote data file directly into a pandas DataFrame
        df = pd.read_csv(dataset_url)
        
        # Clean or rename columns to match your Supabase 'mars_locations' schema if needed
        # (Assuming columns include name, latitude, longitude, etc.)
        print(f"Downloaded {len(df)} total records from source. Processing...")
        
        # Take a clean subset or process all rows (e.g., first 500 features for quick hackathon loading)
        df_subset = df.head(500)
        
        # Convert DataFrame rows into dictionary format for Supabase
        records = df_subset.to_dict(orient="records")
        
        print(f"Uploading {len(records)} records in bulk to Supabase...")
        
        # Bulk insert into Supabase
        response = supabase.table("mars_locations").insert(records).execute()
        
        print("Successfully bulk-inserted NASA planetary data into Supabase!")
        print(response)
        
    except Exception as e:
        print(f"An error occurred during bulk ingestion: {e}")

if __name__ == "__main__":
    bulk_ingest_nasa_data()