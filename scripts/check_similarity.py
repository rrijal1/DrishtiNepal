
from agents.common.db import db

def check_similarity():
    actions = db.table("actions").select("id, title_en, embedding").execute().data
    for action in actions:
        print(f"Action: {action['title_en']}")
        matches = db.rpc("match_manifesto_items", {
            "query_embedding": action["embedding"],
            "match_threshold": 0.0, # No threshold
            "match_count": 5
        }).execute().data
        for m in matches:
            print(f"  Match: {m['source_id']} ({m['title_en']}) - Similarity: {m['similarity']}")

if __name__ == "__main__":
    check_similarity()
