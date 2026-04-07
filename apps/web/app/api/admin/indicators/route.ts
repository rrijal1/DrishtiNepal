import { requireAdmin, supabaseAdmin, unauthorized } from "@/lib/admin";
import { NextRequest, NextResponse } from "next/server";

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

  const { indicator_id, value, measured_date, source_url, source_text } =
    body as Record<string, string | undefined>;

  if (!indicator_id || typeof indicator_id !== "string") {
    return NextResponse.json(
      { error: "indicator_id required" },
      { status: 400 },
    );
  }
  const numericValue = Number(value);
  if (value === undefined || value === "" || isNaN(numericValue)) {
    return NextResponse.json(
      { error: "numeric value required" },
      { status: 400 },
    );
  }
  if (!measured_date) {
    return NextResponse.json(
      { error: "measured_date required" },
      { status: 400 },
    );
  }
  if (!source_url || !source_url.trim()) {
    return NextResponse.json({ error: "source_url required" }, { status: 400 });
  }
  if (!source_text || !source_text.trim()) {
    return NextResponse.json(
      { error: "source_text required" },
      { status: 400 },
    );
  }

  // Insert measurement row
  const { error: insertErr } = await db.from("indicator_measurements").insert({
    indicator_id,
    value: numericValue,
    measured_date,
    source_url: source_url.trim(),
    source_text: source_text.trim(),
    entered_by: user,
  });

  if (insertErr) {
    return NextResponse.json(
      { error: "Failed to insert measurement: " + insertErr.message },
      { status: 500 },
    );
  }

  // Update the indicator's current_value and measured_date
  const { error: updateErr } = await db
    .from("outcome_indicators")
    .update({
      current_value: numericValue,
      measured_date,
      updated_at: new Date().toISOString(),
    })
    .eq("id", indicator_id);

  if (updateErr) {
    return NextResponse.json(
      {
        error:
          "Measurement saved but failed to update indicator: " +
          updateErr.message,
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    success: true,
    indicator_id,
    value: numericValue,
  });
}
