
import json
from agents.common.db import db

def seed_assignments():
    # 1. Fetch all active ministers
    ministers = db.table("ministers").select("id, name_en").eq("status", "active").execute().data
    minister_map = {m["name_en"]: m["id"] for m in ministers}

    # 2. Define Category -> Minister Name(s) mapping
    category_to_ministers = {
        "governance": ["Balendra Shah", "Pratibha Rawal", "Sudan Gurung"],
        "social_justice": ["Balendra Shah", "Sita Badi"],
        "justice": ["Sobita Gautam"],
        "economy": ["Dr. Swarnim Wagle", "Balendra Shah", "Gauri Kumari Yadav"],
        "education": ["Sasmit Pokharel"],
        "health": ["Nisha Mehta"],
        "infrastructure": ["Sunil Lamsal"],
        "agriculture": ["Geeta Chaudhary"],
        "tourism": ["Khadak Raj Poudel"],
        "energy": ["Biraj Bhakta Shrestha"],
        "technology": ["Dr. Bikram Timilsina"],
        "labor": ["Ramjee Yadav"],
        "foreign_policy": ["Shishir Khanal"],
        "diaspora": ["Shishir Khanal"],
        "environment": ["Biraj Bhakta Shrestha"],
        "sports": ["Balendra Shah"]
    }

    # 3. Fetch all manifesto items
    manifesto_items = db.table("manifesto_items").select("id, category, source_id").execute().data

    # 4. Create assignments
    assignments = []
    for item in manifesto_items:
        category = item["category"]
        source_id = item["source_id"]
        
        # Base mapping from category
        minister_names = category_to_ministers.get(category, ["Balendra Shah"])
        
        # Specific overrides/additions
        if source_id == "bp-097": # Border Security
            minister_names = list(set(minister_names + ["Sudan Gurung", "Shishir Khanal"]))
        elif source_id in ["bp-003", "bp-004"]: # Assets, NID
            minister_names = list(set(minister_names + ["Sudan Gurung"]))

        for name in minister_names:
            if name in minister_map:
                assignments.append({
                    "minister_id": minister_map[name],
                    "manifesto_item_id": item["id"]
                })

    # 5. Insert in batches
    if assignments:
        # Clear existing
        db.table("minister_manifesto_assignments").delete().neq("minister_id", "00000000-0000-0000-0000-000000000000").execute()
        
        # Batch insert
        batch_size = 100
        for i in range(0, len(assignments), batch_size):
            batch = assignments[i:i+batch_size]
            db.table("minister_manifesto_assignments").insert(batch).execute()
        
        print(f"Successfully seeded {len(assignments)} assignments.")
    else:
        print("No assignments to seed.")

if __name__ == "__main__":
    seed_assignments()
