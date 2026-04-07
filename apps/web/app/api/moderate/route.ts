import { supabaseAdmin } from "@/lib/admin";
import { NextRequest, NextResponse } from "next/server";

const VALID_ACTIONS = new Set([
  "approve",
  "reject",
  "needs_revision",
  "assign",
]);
const VALID_CONTENT_TYPES = new Set([
  "gazette_entry",
  "parliament_record",
  "evidence_assessment",
  "action",
  "post",
  "manifesto_edit",
  "public_submission",
  "score_update",
]);

export async function POST(req: NextRequest) {
  const db = supabaseAdmin();

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { review_item_id, action, reviewer, notes } = body as Record<
    string,
    string | null | undefined
  >;

  // Validation
  if (!review_item_id || typeof review_item_id !== "string") {
    return NextResponse.json(
      { error: "review_item_id required" },
      { status: 400 },
    );
  }
  if (!action || !VALID_ACTIONS.has(action)) {
    return NextResponse.json(
      { error: `action must be one of: ${[...VALID_ACTIONS].join(", ")}` },
      { status: 400 },
    );
  }
  if (!reviewer || typeof reviewer !== "string" || reviewer.trim().length < 2) {
    return NextResponse.json(
      { error: "reviewer name required (min 2 chars)" },
      { status: 400 },
    );
  }

  // Fetch the review item
  const { data: item, error: fetchError } = await db
    .from("content_review_queue")
    .select("*")
    .eq("id", review_item_id)
    .single();

  if (fetchError || !item) {
    return NextResponse.json(
      { error: "Review item not found" },
      { status: 404 },
    );
  }

  // Map action to review queue status
  const statusMap: Record<string, string> = {
    approve: "approved",
    reject: "rejected",
    needs_revision: "needs_revision",
    assign: "in_review",
  };

  const now = new Date().toISOString();

  // Update the review queue item
  const { error: updateError } = await db
    .from("content_review_queue")
    .update({
      status: statusMap[action],
      reviewed_by: reviewer.trim(),
      review_notes: notes?.trim() || null,
      reviewed_at: action !== "assign" ? now : null,
      assigned_to: action === "assign" ? reviewer.trim() : item.assigned_to,
    })
    .eq("id", review_item_id);

  if (updateError) {
    return NextResponse.json(
      { error: "Failed to update review item" },
      { status: 500 },
    );
  }

  // Propagate the decision to the source content
  if (action === "approve" || action === "reject") {
    await propagateDecision(
      db,
      item.content_type,
      item.content_id,
      action,
      reviewer.trim(),
    );
  }

  return NextResponse.json({
    success: true,
    review_item_id,
    action,
    status: statusMap[action],
  });
}

async function propagateDecision(
  db: any,
  contentType: string,
  contentId: string,
  action: string,
  reviewer: string,
) {
  const reviewStatus = action === "approve" ? "reviewed" : "flagged";
  const now = new Date().toISOString();

  switch (contentType) {
    case "gazette_entry":
      await db
        .from("gazette_entries")
        .update({
          review_status: reviewStatus,
          reviewed_by: reviewer,
          updated_at: now,
        })
        .eq("id", contentId);
      break;

    case "parliament_record":
      await db
        .from("parliament_records")
        .update({
          review_status: reviewStatus,
          reviewed_by: reviewer,
          updated_at: now,
        })
        .eq("id", contentId);
      break;

    case "evidence_assessment":
      await db
        .from("initiative_evidence")
        .update({
          status: action === "approve" ? "approved" : "needs_reassessment",
          reviewed_by: reviewer,
          reassessed_at: now,
        })
        .eq("id", contentId);
      break;

    case "public_submission":
      await db
        .from("public_submissions")
        .update({
          status: action === "approve" ? "accepted" : "rejected",
          reviewer_notes: `Reviewed by ${reviewer} on ${now}`,
          updated_at: now,
        })
        .eq("id", contentId);
      break;

    case "manifesto_edit":
      await db
        .from("manifesto_edits")
        .update({
          status: action === "approve" ? "approved" : "rejected",
          reviewed_by: reviewer,
          reviewed_at: now,
        })
        .eq("id", contentId);
      break;

    default:
      // No propagation for other types
      break;
  }
}
