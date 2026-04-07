import { supabaseAdmin } from "@/lib/admin";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const type = searchParams.get("type");
  const id = searchParams.get("id");

  if (!type || !id) {
    return NextResponse.json(
      { error: "type and id required" },
      { status: 400 },
    );
  }

  const db = supabaseAdmin();

  let data: Record<string, unknown> | null = null;

  try {
    switch (type) {
      case "evidence_assessment": {
        const r = await db
          .from("initiative_evidence")
          .select(
            "id, assessment_en, assessment_np, probability, citations, status, assessed_at, metadata, manifesto_item_id",
          )
          .eq("id", id)
          .single();
        if (r.data) {
          // Enrich with manifesto item title
          const mi = await db
            .from("manifesto_items")
            .select("source_id, title_en, item_text_en")
            .eq("id", r.data.manifesto_item_id)
            .maybeSingle();
          data = { ...r.data, manifesto_item: mi.data ?? null };
        }
        break;
      }

      case "gazette_entry": {
        const r = await db
          .from("gazette_entries")
          .select(
            "id, gazette_number, title_en, title_np, summary_en, category, significance, published_date, source_url, pdf_url, review_status",
          )
          .eq("id", id)
          .single();
        data = r.data;
        break;
      }

      case "parliament_record": {
        const r = await db
          .from("parliament_records")
          .select("*")
          .eq("id", id)
          .single();
        data = r.data;
        break;
      }

      case "post": {
        const r = await db
          .from("posts")
          .select(
            "id, title_en, title_np, excerpt_en, content_en, category, tags, status, source_url, ai_generated, created_at",
          )
          .eq("id", id)
          .single();
        data = r.data;
        break;
      }

      case "public_submission": {
        const r = await db
          .from("public_submissions")
          .select("*")
          .eq("id", id)
          .single();
        data = r.data;
        break;
      }

      case "manifesto_edit": {
        const r = await db
          .from("manifesto_edits")
          .select("*")
          .eq("id", id)
          .single();
        data = r.data;
        break;
      }

      default:
        return NextResponse.json(
          { error: "Unsupported content type" },
          { status: 400 },
        );
    }
  } catch (err) {
    return NextResponse.json({ error: "Fetch failed" }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ type, data });
}
