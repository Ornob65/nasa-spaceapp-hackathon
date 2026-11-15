import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Missing Supabase credentials in your .env file.")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Curated core Martian landmarks dataset (Volcanoes, Craters, Valleys, Plains, and Landing Sites)
MARS_LANDMARKS = [
    # --- Massive Volcanoes ---
    {"name": "Olympus Mons", "latitude": 18.65, "longitude": 226.2, "feature_type": "volcano", "description": "The largest volcano in the solar system."},
    {"name": "Ascraeus Mons", "latitude": 11.92, "longitude": 255.5, "feature_type": "volcano", "description": "The northernmost of the three Tharsis volcanoes."},
    {"name": "Pavonis Mons", "latitude": 0.48, "longitude": 246.0, "feature_type": "volcano", "description": "Middle volcano of the Tharsis Montes chain."},
    {"name": "Arsia Mons", "latitude": -9.4, "longitude": 239.0, "feature_type": "volcano", "description": "Southernmost volcano of the Tharsis region."},
    {"name": "Elysium Mons", "latitude": 25.0, "longitude": 213.0, "feature_type": "volcano", "description": "Major volcano in the Elysium volcanic province."},
    {"name": "Alba Mons", "latitude": 40.5, "longitude": 250.0, "feature_type": "volcano", "description": "Vast volcanic construct with extremely low profile."},
    {"name": "Dome 1 (Tharsis)", "latitude": 15.0, "longitude": 240.0, "feature_type": "volcano", "description": "Minor volcanic formation."},
    {"name": "Syrtis Major Planum", "latitude": 8.4, "longitude": 69.5, "feature_type": "volcano", "description": "Dark volcanic province on Mars."},
    
    # --- Major Craters ---
    {"name": "Gale Crater", "latitude": -5.4, "longitude": 137.8, "feature_type": "crater", "description": "Landing site of the Curiosity rover."},
    {"name": "Jezero Crater", "latitude": 18.38, "longitude": 77.58, "feature_type": "crater", "description": "Ancient lake basin and landing site of Perseverance."},
    {"name": "Hellas Planitia", "latitude": -42.4, "longitude": 70.5, "feature_type": "crater", "description": "Massive impact basin in the southern hemisphere."},
    {"name": "Argyre Planitia", "latitude": -49.7, "longitude": 316.0, "feature_type": "crater", "description": "Large circular impact basin."},
    {"name": "Isidis Planitia", "latitude": 12.9, "longitude": 87.0, "feature_type": "crater", "description": "Huge impact basin located near the Martian equator."},
    {"name": "Utopia Planitia", "latitude": 46.7, "longitude": 117.5, "feature_type": "crater", "description": "Largest recognized impact basin on Mars."},
    {"name": "Crater Schiaparelli", "latitude": -2.7, "longitude": 343.5, "feature_type": "crater", "description": "Prominent equatorial impact crater."},
    {"name": "Crater Huygens", "latitude": -13.9, "longitude": 55.4, "feature_type": "crater", "description": "Large ancient impact crater named after Christiaan Huygens."},
    {"name": "Crater Antoniadi", "latitude": 21.5, "longitude": 299.1, "feature_type": "crater", "description": "Complex impact crater in Syrtis Major."},
    {"name": "Crater Cassini", "latitude": 23.8, "longitude": 328.2, "feature_type": "crater", "description": "Prominent crater in Arabia Terra."},
    {"name": "Crater Lyot", "latitude": 50.8, "longitude": 330.7, "feature_type": "crater", "description": "Large impact crater in the northern lowlands."},
    {"name": "Crater Korolev", "latitude": 73.0, "longitude": 195.5, "feature_type": "crater", "description": "Ice-filled crater in the northern lowlands."},
    {"name": "Crater Gale A", "latitude": -4.8, "longitude": 138.2, "feature_type": "crater", "description": "Secondary or minor feature near Gale."},
    {"name": "Crater Mojave", "latitude": 7.5, "longitude": 33.0, "feature_type": "crater", "description": "Well-preserved young impact crater."},
    {"name": "Crater Zunil", "latitude": 7.7, "longitude": 193.9, "feature_type": "crater", "description": "Rayed impact crater source of extensive ray systems."},
    {"name": "Crater Gratteri", "latitude": -18.2, "longitude": 302.5, "feature_type": "crater", "description": "Cataloged impact crater."},
    {"name": "Crater Lonar", "latitude": -33.5, "longitude": 219.0, "feature_type": "crater", "description": "Named impact structure."},
    
    # --- Valleys & Canyons (Chasmata / Valles) ---
    {"name": "Valles Marineris", "latitude": -9.8, "longitude": 293.5, "feature_type": "valley", "description": "The grand canyon system of Mars."},
    {"name": "Melas Chasma", "latitude": -9.8, "longitude": 283.6, "feature_type": "valley", "description": "Deepest part of Valles Marineris."},
    {"name": "Ius Chasma", "latitude": -7.2, "longitude": 264.0, "feature_type": "valley", "description": "Western section of Valles Marineris."},
    {"name": "Tithonium Chasma", "latitude": -4.6, "longitude": 275.5, "feature_type": "valley", "description": "Parallel canyon branch of Valles Marineris."},
    {"name": "Ophir Chasma", "latitude": -4.0, "longitude": 287.5, "feature_type": "valley", "description": "Northern trough section of Valles Marineris."},
    {"name": "Candor Chasma", "latitude": -6.5, "longitude": 291.0, "feature_type": "valley", "description": "Central trough system of Valles Marineris."},
    {"name": "Coprates Chasma", "latitude": -13.4, "longitude": 303.0, "feature_type": "valley", "description": "Eastern canyon section of Valles Marineris."},
    {"name": "Eos Chasma", "latitude": -12.1, "longitude": 314.0, "feature_type": "valley", "description": "Easternmost deep canyon of Valles Marineris."},
    {"name": "Kasei Valles", "latitude": 24.6, "longitude": 295.0, "feature_type": "valley", "description": "Vast outflow channel system."},
    {"name": "Ares Vallis", "latitude": 10.3, "longitude": 344.2, "feature_type": "valley", "description": "Outflow channel and Pathfinder landing site."},
    {"name": "Tiu Valles", "latitude": 13.0, "longitude": 324.0, "feature_type": "valley", "description": "Ancient water erosion channel."},
    {"name": "Simud Valles", "latitude": 18.5, "longitude": 320.0, "feature_type": "valley", "description": "Anastomosing channel system."},
    {"name": "Maadim Vallis", "latitude": -21.5, "longitude": 177.3, "feature_type": "valley", "description": "Large ancient outflow channel flowing into Gusev."},
    {"name": "Nirgal Vallis", "latitude": -28.4, "longitude": 318.0, "feature_type": "valley", "description": "Extensive branching valley network."},
    {"name": "Nanedi Valles", "latitude": 4.8, "longitude": 349.0, "feature_type": "valley", "description": "Sinuous valley carved into plateau."},
    {"name": "Al-Qahira Vallis", "latitude": -19.5, "longitude": 197.8, "feature_type": "valley", "description": "Ancient valley network."},
    
    # --- Plains & Terrae ---
    {"name": "Tharsis Tholus", "latitude": 13.4, "longitude": 269.4, "feature_type": "plain", "description": "Volcanic dome in the Tharsis region."},
    {"name": "Amazonis Planitia", "latitude": 24.8, "longitude": 196.0, "feature_type": "plain", "description": "Smooth, flat lowland plain."},
    {"name": "Arcadia Planitia", "latitude": 47.0, "longitude": 192.0, "feature_type": "plain", "description": "Extensive smooth plain in northern hemisphere."},
    {"name": "Elysium Planitia", "latitude": 3.0, "longitude": 155.0, "feature_type": "plain", "description": "Smooth volcanic plain surrounding Elysium."},
    {"name": "Acidalia Planitia", "latitude": 46.7, "longitude": 339.0, "feature_type": "plain", "description": "Dark smooth plain in the northern latitudes."},
    {"name": "Chryse Planitia", "latitude": 9.9, "longitude": 320.0, "feature_type": "plain", "description": "Smooth impact basin plain near Viking 1 site."},
    {"name": "Arabia Terra", "latitude": 23.0, "longitude": 310.0, "feature_type": "plain", "description": "Vast cratered upland region."},
    {"name": "Noachis Terra", "latitude": -45.0, "longitude": 330.0, "feature_type": "plain", "description": "Heavily cratered highland terrain."},
    {"name": "Terra Sirenum", "latitude": -38.0, "longitude": 210.0, "feature_type": "plain", "description": "Southern highland terrain region."},
    {"name": "Terra Cimmeria", "latitude": -34.0, "longitude": 145.0, "feature_type": "plain", "description": "Ancient highland cratered terrain."},
    {"name": "Xanthii Terra", "latitude": -3.0, "longitude": 312.0, "feature_type": "plain", "description": "Upland terrain section."},
    {"name": "Promethei Terra", "latitude": -78.0, "longitude": 90.0, "feature_type": "plain", "description": "Highland region near south pole."},
    {"name": "Tempe Terra", "latitude": 40.0, "longitude": 290.0, "feature_type": "plain", "description": "Ancient plateau region."},
    {"name": "Arcadia Terra", "latitude": 38.0, "longitude": 185.0, "feature_type": "plain", "description": "Northern upland area."},
    
    # --- Historical Landing Sites & Other Features ---
    {"name": "Viking 1 Landing Site (Musha)", "latitude": 22.48, "longitude": 312.05, "feature_type": "landing_site", "description": "Successful historic lander site in Chryse Planitia."},
    {"name": "Viking 2 Landing site (Utopia)", "latitude": 48.27, "longitude": 134.0, "feature_type": "landing_site", "description": "Historic lander site in Utopia Planitia."},
    {"name": "Pathfinder Landing Site (Carl Sagan Station)", "latitude": 19.33, "longitude": 326.45, "feature_type": "landing_site", "description": "Sojourner rover landing site in Ares Vallis."},
    {"name": "Spirit Landing Site (Columbia Memorial Station)", "latitude": -14.57, "longitude": 175.47, "feature_type": "landing_site", "description": "Gusev Crater rover landing site."},
    {"name": "Opportunity Landing Site (Challenger Memorial Station)", "latitude": -1.95, "longitude": 354.47, "feature_type": "landing_site", "description": "Meridiani Planum rover landing site."},
    {"name": "Phoenix Landing Site", "latitude": 68.22, "longitude": 234.25, "feature_type": "landing_site", "description": "Polar arctic lander site in Vastitas Borealis."},
    {"name": "InSight Landing Site", "latitude": 4.5, "longitude": 135.62, "feature_type": "landing_site", "description": "Geophysical lander site in Elysium Planitia."},
    {"name": "Vastitas Borealis", "latitude": 75.0, "longitude": 0.0, "feature_type": "plain", "description": "Vast lowland plain covering Mars' northern pole."},
    {"name": "Planum Australe", "latitude": -83.8, "longitude": 160.0, "feature_type": "plain", "description": "Southern polar plateau containing carbon dioxide ice cap."},
    {"name": "Planum Boreum", "latitude": 88.0, "longitude": 0.0, "feature_type": "plain", "description": "Northern polar plateau containing water ice cap."},
    {"name": "Olympus Rupes", "latitude": -13.8, "longitude": 227.0, "feature_type": "scarp", "description": "Massive cliff surrounding Olympus Mons base."},
    {"name": "Scandia Colles", "latitude": 75.0, "longitude": 200.0, "feature_type": "hill", "description": "Hilly region in the northern high latitudes."},
    {"name": "Acheron Fossae", "latitude": 37.5, "longitude": 222.0, "feature_type": "trough", "description": "Extensive system of parallel graben troughs."},
    {"name": "Tempe Fossae", "latitude": 38.0, "longitude": 288.0, "feature_type": "trough", "description": "Fracture network in Tempe Terra."},
    {"name": "Sirenum Fossae", "latitude": -32.5, "longitude": 198.0, "feature_type": "trough", "description": "Major fault trough system in Terra Sirenum."}
]

def ingest_landmarks():
    print(f"Preparing to insert {len(MARS_LANDMARKS)} core Martian landmarks into Supabase...")
    
    try:
        # Perform bulk insert into 'mars_locations' table
        response = supabase.table("mars_locations").insert(MARS_LANDMARKS).execute()
        print("--- INGESTION SUCCESSFUL ---")
        print(f"Successfully inserted {len(MARS_LANDMARKS)} locations into the database.")
    except Exception as e:
        print(f"Error during Supabase insertion: {e}")

if __name__ == "__main__":
    ingest_landmarks()
    