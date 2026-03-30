
from agents.common.db import db
ministers = db.table("ministers").select("id, name_en").execute().data
for m in ministers:
    print(f"{m['name_en']}: {m['id']}")
