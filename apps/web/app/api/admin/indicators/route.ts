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

  const { action } = body as Record<string, string | undefined>;

  // ── Add Result Indicator ────────────────────────────────────────────────────
  if (action === "add_result") {
    const { indicator_name, indicator_label, category, priority_area, unit,
      direction, baseline_value, target_value, current_value, source,
      source_url: srcUrl, weight, manifesto_item_id, minister_id, ministry } =
      body as Record<string, string | undefined>;

    if (!indicator_name || !indicator_label || !category || !source) {
      return NextResponse.json(
        { error: "indicator_name, indicator_label, category, source are required" },
        { status: 400 },
      );
    }

    const row: Record<string, unknown> = {
      indicator_name: indicator_name.trim(),
      indicator_label: indicator_label.trim(),
      category: category.trim(),
      priority_area: priority_area?.trim() ?? null,
      unit: unit?.trim() ?? "",
      direction: direction?.trim() ?? "higher_is_better",
      baseline_value: baseline_value ? Number(baseline_value) : null,
      target_value: target_value ? Number(target_value) : null,
      current_value: current_value ? Number(current_value) : null,
      source: source.trim(),
      source_url: srcUrl?.trim() ?? null,
      weight: weight ? Number(weight) : 5,
      ministry: ministry?.trim() ?? "",
      indicator_type: "result",
    };
    if (manifesto_item_id) row.manifesto_item_id = manifesto_item_id;
    if (minister_id) row.minister_id = minister_id;

    const { data, error } = await db.from("outcome_indicators").insert(row).select("id").single();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true, id: data.id });
  }

  // ── Add Process Indicator ───────────────────────────────────────────────────
  if (action === "add_process") {
    const { indicator_label, process_status, parent_indicator_id,
      manifesto_item_id, minister_id, ministry, category } =
      body as Record<string, string | undefined>;

    if (!indicator_label) {
      return NextResponse.json({ error: "indicator_label required" }, { status: 400 });
    }

    const row: Record<string, unknown> = {
      indicator_name: indicator_label.trim(),
      indicator_label: indicator_label.trim(),
      category: category?.trim() ?? "process",
      unit: "",
      direction: "higher_is_better",
      source: "manual",
      ministry: ministry?.trim() ?? "",
      indicator_type: "process",
      process_status: process_status ?? "not_started",
    };
    if (parent_indicator_id) row.parent_indicator_id = parent_indicator_id;
    if (manifesto_item_id) row.manifesto_item_id = manifesto_item_id;
    if (minister_id) row.minister_id = minister_id;

    const { data, error } = await db.from("outcome_indicators").insert(row).select("id").single();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true, id: data.id });
  }

  // ── Delete Indicator ────────────────────────────────────────────────────────
  if (action === "delete") {
    const { indicator_id } = body as Record<string, string | undefined>;
    if (!indicator_id) {
      return NextResponse.json({ error: "indicator_id required" }, { status: 400 });
    }
    const { error } = await db.from("outcome_indicators").delete().eq("id", indicator_id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  }

  // ── Existing: requires indicator_id ────────────────────────────────────────
  const {
    indicator_id,
    process_status,
    value,
    measured_date,
    source_url,
    source_text,
  } = body as Record<string, string | undefined>;

  if (!indicator_id || typeof indicator_id !== "string") {
    return NextResponse.json(
      { error: "indicator_id required" },
      { status: 400 },
    );
  }

  // Handle process status update
  if (action === "update_process_status") {
    const validStatuses = [
      "not_started",
      "ongoing",
      "resolved",
      "blocked",
      "reversed",
    ];
    if (!process_status || !validStatuses.includes(process_status)) {
      return NextResponse.json(
        { error: "Valid process_status required" },
        { status: 400 },
      );
    }
    const { error: updateErr } = await db
      .from("outcome_indicators")
      .update({ process_status, updated_at: new Date().toISOString() })
      .eq("id", indicator_id);
    if (updateErr) {
      return NextResponse.json(
        { error: "Failed to update: " + updateErr.message },
        { status: 500 },
      );
    }
    return NextResponse.json({ success: true, indicator_id, process_status });
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
