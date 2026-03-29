"""Check which tables exist in Supabase and their state."""
from supabase import create_client
import os
from dotenv import load_dotenv
load_dotenv()

db = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])

tables = ["ministers", "posts", "cabinet_decisions", "manifesto_items",
           "governance_agendas", "raw_news", "scores", "actions", "agent_logs"]

for t in tables:
    try:
        r = db.table(t).select("id").limit(1).execute()
        print(f"{t}: EXISTS ({len(r.data)} rows)")
    except Exception as e:
        print(f"{t}: ERROR - {e}")
