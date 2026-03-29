"""Verify database schema columns match frontend expectations."""
import psycopg2
import os
from dotenv import load_dotenv
load_dotenv()

conn = psycopg2.connect(os.environ["DATABASE_URL"])
cur = conn.cursor()

for table in ["posts", "cabinet_decisions", "scores", "ministers"]:
    cur.execute(
        "SELECT column_name FROM information_schema.columns WHERE table_name = %s ORDER BY ordinal_position",
        (table,),
    )
    cols = [r[0] for r in cur.fetchall()]
    print(f"{table}: {cols}")

conn.close()
