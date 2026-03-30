
from agents.common.db import db
ministers = db.table("ministers").select("id, name_en").execute().data
for m in ministers[:2]:
    print(f"Name: {m['name_en']}, ID: {m['id']} (type: {type(m['id'])})")
