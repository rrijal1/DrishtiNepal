import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.SUPABASE_SERVICE_KEY ?? "",
  );

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const {
    title_en,
    title_np,
    decision_date,
    summary_en,
    source_url,
    significance,
    selected_bp_ids,
  } = body as {
    title_en?: string;
    title_np?: string;
    decision_date?: string;
    summary_en?: string;
    source_url?: string;
    significance?: string;
    selected_bp_ids?: string[];
  };

  if (!title_en || !title_en.trim()) {
    return NextResponse.json({ error: "title_en required" }, { status: 400 });
  }
  if (!decision_date) {
    return NextResponse.json(
      { error: "decision_date required" },
      { status: 400 },
    );
  }

  const validSignificance = ["critical", "high", "medium", "low"];
  const sig = validSignificance.includes(significance ?? "")
    ? significance
    : "medium";

  // Insert the cabinet decision
  const { data: decision, error: insertErr } = await supabaseAdmin
    .from("cabinet_decisions")
    .insert({
      title_en: title_en.trim(),
      title_np: title_np?.trim() || null,
      summary_en: summary_en?.trim() || null,
      source_url: source_url?.trim() || null,
      significance: sig,
      decision_date,
      metadata: { manually_entered: true },
    })
    .select("id")
    .single();

  if (insertErr || !decision) {
    return NextResponse.json(
      { error: "Failed to create decision" },
      { status: 500 },
    );
  }

  const decisionId = decision.id;

  // Resolve bp-XXX source IDs to UUIDs and create manifesto links
  const bpIds = Array.isArray(selected_bp_ids) ? selected_bp_ids : [];
  if (bpIds.length > 0) {
    const { data: items } = await supabaseAdmin
      .from("manifesto_items")
      .select("id, source_id")
      .in("source_id", bpIds);

    if (items && items.length > 0) {
      const links = items.map((item) => ({
        decision_id: decisionId,
        manifesto_item_id: item.id,
      }));
      // Ignore conflicts (idempotent)
      await supabaseAdmin
        .from("cabinet_decision_manifesto_links")
        .upsert(links, { onConflict: "decision_id,manifesto_item_id" });
    }
  }

  return NextResponse.json({
    success: true,
    decision_id: decisionId,
    links_created: bpIds.length,
  });
}
