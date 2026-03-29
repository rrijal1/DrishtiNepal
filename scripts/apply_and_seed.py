"""
Drishti Nepal — Apply Schema + Seed Test Data
Run: python scripts/apply_and_seed.py

Uses the Supabase service role key (from .env) to seed data.
NOTE: You must first apply 000_combined_setup.sql via the Supabase SQL Editor.
"""

import json
import sys
from datetime import date, timedelta, datetime, timezone
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from agents.common.db import db
from agents.common.utils import setup_logger

logger = setup_logger("apply_and_seed")
DATA_DIR = Path(__file__).resolve().parent.parent / "data"
DECISION_DATE = date(2026, 3, 27)


def load_json(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


# ------------------------------------------------------------------
# Seed Ministers
# ------------------------------------------------------------------
def seed_ministers():
    cabinet = load_json(DATA_DIR / "ministers" / "cabinet_2026.json")
    rows = []
    for m in cabinet["ministers"]:
        rows.append(
            {
                "name_en": m["name_en"],
                "name_np": m["name_np"],
                "portfolio_en": m["portfolio_en"],
                "portfolio_np": m["portfolio_np"],
                "party": m["party"],
                "appointed_date": m["appointed_date"],
                "photo_url": m.get("photo_url"),
                "bio_summary_en": m.get("bio_summary_en") or None,
                "bio_summary_np": m.get("bio_summary_np") or None,
                "previous_roles": m.get("previous_roles", []),
                "status": "active",
            }
        )
    result = db.table("ministers").upsert(rows, on_conflict="name_en").execute()
    logger.info(f"Seeded {len(result.data)} ministers")
    return result.data


# ------------------------------------------------------------------
# Seed Manifesto — Bachha Patra
# ------------------------------------------------------------------
def seed_bachha_patra():
    bp = load_json(DATA_DIR / "manifesto" / "bachha_patra.json")
    rows = []
    for f in bp["foundations"]:
        rows.append(
            {
                "source_id": f["id"],
                "document_type": "bachha_patra",
                "category": f["category"],
                "title_en": f["title_en"],
                "item_text_en": f["title_en"],
                "item_text_np": f.get("title_np", f["title_en"]),
                "key_commitments": f.get("key_commitments", []),
                "measurable": f.get("measurable", False),
                "target_metrics": f.get("target_metrics"),
                "priority": f.get("priority", "medium"),
                "status": "not_started",
                "metadata": {"number": f["number"], "note": f.get("note")},
            }
        )
    result = db.table("manifesto_items").upsert(rows, on_conflict="source_id").execute()
    logger.info(f"Seeded {len(result.data)} bachha patra foundations")
    return result.data


# ------------------------------------------------------------------
# Seed Manifesto — Karar Patra
# ------------------------------------------------------------------
def seed_karar_patra():
    kp = load_json(DATA_DIR / "manifesto" / "karar_patra.json")
    rows = []
    for pa in kp["priority_areas"]:
        rows.append(
            {
                "source_id": pa["id"],
                "document_type": "karar_patra",
                "category": pa["category"],
                "title_en": pa["title_en"],
                "title_np": pa.get("title_np"),
                "item_text_en": pa.get("goal_en", pa["title_en"]),
                "item_text_np": pa.get("goal_np", pa.get("title_np", pa["title_en"])),
                "current_situation_en": pa.get("current_situation_en"),
                "current_situation_np": pa.get("current_situation_np"),
                "goal_en": pa.get("goal_en"),
                "goal_np": pa.get("goal_np"),
                "key_targets": pa.get("key_targets", []),
                "bachha_patra_links": pa.get("bachha_patra_links", []),
                "measurable": pa.get("measurable", False),
                "priority": "high",
                "status": "not_started",
                "metadata": {"number": pa["number"]},
            }
        )
    result = db.table("manifesto_items").upsert(rows, on_conflict="source_id").execute()
    logger.info(f"Seeded {len(result.data)} karar patra priority areas")
    return result.data


# ------------------------------------------------------------------
# Seed Governance Agendas
# ------------------------------------------------------------------
DEADLINE_DAYS = {
    "immediate": 0,
    "7 days": 7,
    "15 days": 15,
    "30 days": 30,
    "60 days": 60,
    "90 days": 90,
    "100 days": 100,
}


def parse_deadline_date(raw):
    if not raw:
        return None
    raw_lower = raw.strip().lower()
    if raw_lower in DEADLINE_DAYS:
        return (DECISION_DATE + timedelta(days=DEADLINE_DAYS[raw_lower])).isoformat()
    for suffix in (" days", " day"):
        if raw_lower.endswith(suffix):
            try:
                n = int(raw_lower.replace(suffix, "").strip())
                return (DECISION_DATE + timedelta(days=n)).isoformat()
            except ValueError:
                pass
    return None


def seed_agendas():
    ag = load_json(DATA_DIR / "government" / "100_agendas.json")
    rows = []
    for a in ag["agendas"]:
        rows.append(
            {
                "source_id": a["id"],
                "number": a["number"],
                "section": a["section"],
                "category": a["category"],
                "title_en": a["title_en"],
                "summary_en": a.get("summary_en"),
                "deadline": a.get("deadline"),
                "deadline_date": parse_deadline_date(a.get("deadline")),
                "significance": a.get("significance", "medium"),
                "status": a.get("status", "announced"),
                "manifesto_links": a.get("manifesto_links", []),
            }
        )
    result = (
        db.table("governance_agendas").upsert(rows, on_conflict="source_id").execute()
    )
    logger.info(f"Seeded {len(result.data)} governance agendas")
    return result.data


# ------------------------------------------------------------------
# Seed Test Articles (from real news)
# ------------------------------------------------------------------
def seed_test_articles():
    now = datetime.now(timezone.utc).isoformat()

    articles = [
        {
            "category": "cabinet_decision",
            "slug": "2026-03-29-government-unveils-100-point-roadmap",
            "title_en": "Government unveils ambitious 100-point roadmap for effective governance",
            "title_np": "सरकारले प्रभावकारी शासनका लागि महत्त्वाकांक्षी १०० बुँदे कार्ययोजना सार्वजनिक गर्‍यो",
            "content_en": """The government on Saturday unveiled an ambitious 100-point work plan for effective governance. The first Cabinet meeting of the Balendra Shah administration on Friday approved the roadmap for good governance in line with the Rastriya Swatantra Party's manifesto.

Formation of a committee to investigate the properties and assets of senior political officeholders and high-ranking government officials who held public positions after the second people's movement to date in the first phase, within 15 days, is one of the crucial decisions. The committee, which includes experts in law, finance, revenue, and research, will operate under the Prime Minister's Office and the Council of Ministers.

The panel, in the second phase, will probe the assets and properties of those holding crucial public positions between 1991 and 2006.

The government will implement delivery-based governance to make overall government performance efficient, effective, measurable, and accountable, with a focus on bringing direct improvements to people's lives.

Under this framework, each ministry will prepare and implement a work plan for its seven core areas, specifying key tasks, timelines, responsible officials, and performance indicators. Progress on these tasks will be submitted to the Prime Minister's Office for review, evaluation, and periodic reporting.

The government has also announced that it will abolish party-affiliated student organisations in the academic sector and strictly enforce the provision requiring private hospitals to allocate 10 percent of their beds free of charge to needy patients.

In a significant administrative reform measure, the government has announced the abolition of all party-affiliated trade unions within government bodies, aiming to make public administration free from political influence.

To tackle administrative inefficiency caused by an excessively large number of ministries, the government has decided to reduce the number of federal ministries to 17 within 30 days.

The government plans to introduce free "Blue Bus" services for women in all seven provinces to ensure safe transportation. At least 25 buses will be brought into operation within the first 100 days.

Within 15 days, the state will officially acknowledge historical injustices, discrimination, and deprivation faced by marginalised and excluded communities from the state, society, and institutional structures.""",
            "content_np": """सरकारले शनिबार प्रभावकारी शासनका लागि १०० बुँदे कार्ययोजना सार्वजनिक गर्‍यो । बलेन्द्र शाह सरकारको पहिलो मन्त्रिपरिषद् बैठकले शुक्रबार राष्ट्रिय स्वतन्त्र पार्टीको घोषणापत्रअनुसार सुशासनको कार्ययोजना स्वीकृत गर्‍यो ।

दोस्रो जनआन्दोलनपछि सार्वजनिक पद धारण गरेका वरिष्ठ राजनीतिक पदाधिकारी र उच्च सरकारी अधिकारीहरूको सम्पत्ति जाँचका लागि १५ दिनभित्र समिति गठन गर्ने महत्त्वपूर्ण निर्णय गरिएको छ ।

सरकारले पार्टी सम्बद्ध विद्यार्थी संगठनहरू खारेज गर्ने, निजी अस्पताललाई १० प्रतिशत शय्या निःशुल्क उपलब्ध गराउन बाध्य गर्ने र ३० दिनभित्र संघीय मन्त्रालयहरूको संख्या १७ मा झार्ने निर्णय गरेको छ ।

महिलाहरूका लागि सातवटै प्रदेशमा निःशुल्क "Blue Bus" सेवा सुरु गर्ने योजना छ ।""",
            "excerpt_en": "The Balendra Shah administration's first cabinet approved a 100-point roadmap covering asset investigation, ministry restructuring, student org abolition, and free hospital beds.",
            "tags": [
                "cabinet-decision",
                "100-day-plan",
                "governance-reform",
                "balendra-shah",
            ],
            "author_type": "agent",
            "author_name": "Drishti Nepal AI",
            "ai_generated": True,
            "source_url": "https://kathmandupost.com/national/2026/03/29/government-unveils-ambitious-100-point-roadmap-for-effective-governance",
            "status": "published",
            "published_at": now,
        },
        {
            "category": "news_update",
            "slug": "2026-03-29-cib-arrests-ex-minister-khadka-money-laundering",
            "title_en": "CIB arrests ex-minister Khadka in money laundering probe",
            "title_np": "CIB ले पूर्वमन्त्री खड्कालाई मनी लाउन्डरिङ अनुसन्धानमा पक्राउ गर्‍यो",
            "content_en": """The Central Investigation Bureau (CIB) of Nepal Police has arrested Nepali Congress leader and former energy minister Deepak Khadka.

Additional Inspector General of Police Manoj KC, chief of CIB, said Khadka was taken into custody from Budhanilkantha on Sunday morning.

The Department of Money Laundering Investigation had earlier sent a letter to Police Headquarters seeking an inquiry into Khadka. Acting on the request, police detained him for further investigation.

Images and videos had surfaced showing burnt fragments of banknotes at the residences of Khadka and former prime ministers Sher Bahadur Deuba and Pushpa Kamal Dahal following the vandalism and arson on September 9.

The findings were later confirmed through forensic laboratory tests.

Khadka had been embroiled in controversy while serving as the Minister for Energy, Water Resources and Irrigation, particularly in relation to the issuance of licences and awarding of contracts for hydropower projects.

He was accused of receiving financial benefits in exchange for facilitating licences and contracts for projects, with the alleged dealings taking place from within the minister's quarters and the ministry premises. However, no investigation was carried out against him.

Khadka was also implicated in the alleged misappropriation of land belonging to Nepal Scouts in Lainchaur.""",
            "content_np": """नेपाल प्रहरीको केन्द्रीय अनुसन्धान ब्यूरो (CIB) ले नेपाली कांग्रेसका नेता तथा पूर्वऊर्जामन्त्री दीपक खड्कालाई पक्राउ गरेको छ ।

CIB प्रमुख अतिरिक्त प्रहरी महानिरीक्षक मनोज केसीले खड्कालाई आइतबार बिहान बूढानीलकण्ठबाट नियन्त्रणमा लिइएको बताए ।

मनी लाउन्डरिङ अनुसन्धान विभागले प्रहरी प्रधान कार्यालयमा खड्कासम्बन्धी अनुसन्धानका लागि पत्र पठाएको थियो । सोही आधारमा प्रहरीले थप अनुसन्धानका लागि उनलाई पक्राउ गरेको हो ।

सेप्टेम्बर ९ को तोडफोड र आगजनीपछि खड्का र पूर्वप्रधानमन्त्रीहरू शेरबहादुर देउवा र पुष्पकमल दाहालका निवासमा जलेका नोटका टुक्राहरू फेला परेका थिए, जुन फोरेन्सिक प्रयोगशाला परीक्षणबाट पुष्टि भएको थियो ।""",
            "excerpt_en": "CIB arrests former energy minister Deepak Khadka following a Department of Money Laundering Investigation request. Forensic tests confirmed burnt banknote fragments at his residence.",
            "tags": [
                "arrest",
                "money-laundering",
                "deepak-khadka",
                "nepali-congress",
                "september-9",
            ],
            "author_type": "agent",
            "author_name": "Drishti Nepal AI",
            "ai_generated": True,
            "source_url": "https://kathmandupost.com/national/2026/03/29/cib-arrests-ex-minister-khadka-in-money-laundering-probe",
            "status": "published",
            "published_at": now,
        },
    ]

    for article in articles:
        try:
            result = db.table("posts").upsert(article, on_conflict="slug").execute()
            logger.info(f"Seeded article: {article['title_en'][:60]}...")
        except Exception as e:
            logger.error(f"Failed to seed article: {e}")

    # Also create a cabinet decision entry for the 100-point roadmap
    decision = {
        "decision_date": "2026-03-27",
        "title_en": "100-Point Effective Governance Roadmap",
        "title_np": "प्रभावकारी शासन १०० बुँदे कार्ययोजना",
        "summary_en": "The first cabinet meeting of the Balendra Shah administration approved a comprehensive 100-point governance work plan covering asset investigation, ministry restructuring, student organization abolition, free hospital beds, Blue Bus service for women, and delivery-based governance framework.",
        "category": "governance",
        "significance": "critical",
        "source_url": "https://kathmandupost.com/national/2026/03/29/government-unveils-ambitious-100-point-roadmap-for-effective-governance",
    }
    try:
        db.table("cabinet_decisions").insert(decision).execute()
        logger.info("Seeded cabinet decision: 100-Point Roadmap")
    except Exception as e:
        logger.error(f"Failed to seed cabinet decision: {e}")


# ------------------------------------------------------------------
# Main
# ------------------------------------------------------------------
def run():
    print("=" * 60)
    print("  Drishti Nepal — Seeding Database")
    print("=" * 60)

    print("\n[1/5] Seeding ministers...")
    seed_ministers()

    print("[2/5] Seeding bachha patra...")
    seed_bachha_patra()

    print("[3/5] Seeding karar patra...")
    seed_karar_patra()

    print("[4/5] Seeding governance agendas...")
    seed_agendas()

    print("[5/5] Seeding test articles...")
    seed_test_articles()

    print("\n✅ Seeding complete! Run the web app to test.")
    print("   cd apps/web && npm run dev")


if __name__ == "__main__":
    run()
