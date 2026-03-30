
from agents.common.db import db
from agents.common.ai import get_embedding

def populate_action_embeddings():
    actions = db.table("actions").select("id, title_en, description_en").is_("embedding", "null").execute().data
    print(f"Found {len(actions)} actions to embed.")
    
    for action in actions:
        text = f"{action['title_en']}: {action['description_en']}"
        try:
            emb = get_embedding(text)
            db.table("actions").update({"embedding": emb}).eq("id", action["id"]).execute()
            print(f"  Embedded: {action['title_en'][:50]}")
        except Exception as e:
            print(f"  Failed to embed action {action['id']}: {e}")

if __name__ == "__main__":
    populate_action_embeddings()
