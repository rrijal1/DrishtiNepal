import sys
from agents.common.db import db
from agents.common.ai import get_embedding


def populate_manifesto_embeddings(force: bool = False):
    """Embed all manifesto items. Use --force to re-embed everything (e.g. after model change)."""
    if force:
        items = (
            db.table("manifesto_items")
            .select("id, title_en, item_text_en")
            .execute()
            .data
        )
        print(f"Force re-embedding all {len(items)} items.")
    else:
        items = (
            db.table("manifesto_items")
            .select("id, title_en, item_text_en")
            .is_("embedding", "null")
            .execute()
            .data
        )
        print(f"Found {len(items)} items to embed.")

    for item in items:
        text = f"{item['title_en']}: {item['item_text_en']}"
        try:
            emb = get_embedding(text)
            db.table("manifesto_items").update({"embedding": emb}).eq(
                "id", item["id"]
            ).execute()
            print(f"  Embedded: {item['title_en'][:50]}")
        except Exception as e:
            print(f"  Failed to embed {item['id']}: {e}")


if __name__ == "__main__":
    populate_manifesto_embeddings(force="--force" in sys.argv)
