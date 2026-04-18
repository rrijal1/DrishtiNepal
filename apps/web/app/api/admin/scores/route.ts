import { requireAdmin, supabaseAdmin, unauthorized } from "@/lib/admin";
import { NextRequest, NextResponse } from "next/server";

// POST: upsert a score snapshot for a minister + period
// DELETE: remove a score row by id
export async function POST(req: NextRequest) {
  const user = await requireAdmin(req);
  if (!user) return unauthorized();

  const db = supabaseAdmin();

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { minister_id, period_start, period_end, overall, outcome_score,
    manifesto_compliance, public_accountability } =
    body as Record<string, string | undefined>;

  if (!minister_id || !period_start || !period_end) {
    return NextResponse.json(
      { error: "minister_id, period_start, period_end are required" },
      { status: 400 },
    );
  }

  const overallNum = Number(overall);
  if (overall === undefined || isNaN(overallNum) || overallNum < 0 || overallNum > 100) {
    return NextResponse.json(
      { error: "overall must be a number 0–100" },
      { status: 400 },
    );
  }

  const row: Record<string, unknown> = {
    minister_id,
    period_start,
    period_end,
    overall: overallNum,
    outcome_score: outcome_score ? Number(outcome_score) : null,
    manifesto_compliance: manifesto_compliance ? Number(manifesto_compliance) : null,
    public_accountability: public_accountability ? Number(public_accountability) : null,
    scored_at: new Date().toISOString(),
  };

  // Upsert: update if (minister_id, period_start) already exists
  const { data, error } = await db
    .from("scores")
    .upsert(row, { onConflict: "minister_id,period_start" })
    .select("id")
    .single();

  if (error) {
    // Fall back to insert if upsert not supported (no unique constraint)
    const { data: ins, error: insErr } = await db.from("scores").insert(row).select("id").single();
    if (insErr) {
      return NextResponse.json({ error: insErr.message }, { status: 500 });
    }
    return NextResponse.json({ success: true, id: ins.id });
  }

  return NextResponse.json({ success: true, id: data.id });
}

export async function DELETE(req: NextRequest) {
  const user = await requireAdmin(req);
  if (!user) return unauthorized();

  const db = supabaseAdmin();

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { score_id } = body as Record<string, string | undefined>;
  if (!score_id) {
    return NextResponse.json({ error: "score_id required" }, { status: 400 });
  }

  const { error } = await db.from("scores").delete().eq("id", score_id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
