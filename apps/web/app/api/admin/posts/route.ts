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

  const { post_id, action, content_en, content_np, title_en, title_np } =
    body as Record<string, string | null | undefined>;

  if (!post_id || typeof post_id !== "string") {
    return NextResponse.json({ error: "post_id required" }, { status: 400 });
  }

  const validActions = ["approve", "reject", "update"];
  if (!action || !validActions.includes(action)) {
    return NextResponse.json(
      { error: `action must be one of: ${validActions.join(", ")}` },
      { status: 400 },
    );
  }

  const now = new Date().toISOString();

  if (action === "approve") {
    const { error } = await supabaseAdmin
      .from("posts")
      .update({ status: "published", published_at: now })
      .eq("id", post_id);

    if (error) {
      return NextResponse.json(
        { error: "Failed to approve post" },
        { status: 500 },
      );
    }
    return NextResponse.json({ success: true, action: "approved" });
  }

  if (action === "reject") {
    const { error } = await supabaseAdmin
      .from("posts")
      .update({ status: "rejected" })
      .eq("id", post_id);

    if (error) {
      return NextResponse.json(
        { error: "Failed to reject post" },
        { status: 500 },
      );
    }
    return NextResponse.json({ success: true, action: "rejected" });
  }

  if (action === "update") {
    const updates: Record<string, string> = {};
    if (title_en) updates.title_en = title_en;
    if (title_np) updates.title_np = title_np;
    if (content_en) updates.content_en = content_en;
    if (content_np) updates.content_np = content_np;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 },
      );
    }

    const { error } = await supabaseAdmin
      .from("posts")
      .update(updates)
      .eq("id", post_id);

    if (error) {
      return NextResponse.json(
        { error: "Failed to update post" },
        { status: 500 },
      );
    }
    return NextResponse.json({ success: true, action: "updated" });
  }
}
