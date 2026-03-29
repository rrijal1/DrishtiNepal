import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// Use service key for write operations from API routes
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  process.env.SUPABASE_SERVICE_KEY ?? "",
);

const ALLOWED_FIELDS = new Set([
  "item_text_en",
  "item_text_np",
  "description_en",
  "description_np",
  "key_commitments",
  "goal_en",
  "goal_np",
  "current_situation_en",
  "current_situation_np",
]);

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const {
    manifesto_item_id,
    field_name,
    original_text,
    proposed_text,
    reason,
    submitter_name,
    submitter_email,
  } = body as Record<string, string | null | undefined>;

  // Basic validation
  if (!manifesto_item_id || typeof manifesto_item_id !== "string") {
    return NextResponse.json(
      { error: "manifesto_item_id required" },
      { status: 400 },
    );
  }
  if (!field_name || !ALLOWED_FIELDS.has(field_name)) {
    return NextResponse.json(
      { error: "Invalid or disallowed field_name" },
      { status: 400 },
    );
  }
  if (!proposed_text || proposed_text.trim().length < 10) {
    return NextResponse.json(
      { error: "proposed_text must be at least 10 characters" },
      { status: 400 },
    );
  }
  if (proposed_text.trim().length > 10000) {
    return NextResponse.json(
      { error: "proposed_text exceeds maximum length of 10,000 characters" },
      { status: 400 },
    );
  }
  // Validate email format if provided
  if (submitter_email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(submitter_email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 },
      );
    }
  }

  // Verify the item exists and matches the slug
  const { data: item, error: lookupError } = await supabaseAdmin
    .from("manifesto_items")
    .select("id")
    .eq("id", manifesto_item_id)
    .eq("source_id", slug)
    .maybeSingle();

  if (lookupError || !item) {
    return NextResponse.json(
      { error: "Manifesto item not found" },
      { status: 404 },
    );
  }

  const { error: insertError } = await supabaseAdmin
    .from("manifesto_edits")
    .insert({
      manifesto_item_id,
      field_name,
      original_text: original_text?.trim() ?? "",
      proposed_text: proposed_text.trim(),
      reason: reason?.trim() || null,
      submitter_name: submitter_name?.trim() || null,
      submitter_email: submitter_email?.trim() || null,
      status: "pending",
    });

  if (insertError) {
    console.error("manifesto_edits insert error:", insertError);
    return NextResponse.json(
      { error: "Failed to save edit proposal" },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true }, { status: 201 });
}
