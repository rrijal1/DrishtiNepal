
from agents.common.db import db

def update_manifesto_status():
    links = db.table("action_manifesto_links").select("manifesto_item_id, link_type").execute().data
    
    for link in links:
        item_id = link["manifesto_item_id"]
        link_type = link["link_type"]
        
        new_status = "in_progress"
        if link_type == "supports":
            new_status = "partially_fulfilled" # One action might not be enough for full 'fulfilled'
        elif link_type == "contradicts":
            new_status = "broken"
            
        db.table("manifesto_items").update({"status": new_status}).eq("id", item_id).execute()
        print(f"Updated manifesto item {item_id} status to {new_status}")

if __name__ == "__main__":
    update_manifesto_status()
