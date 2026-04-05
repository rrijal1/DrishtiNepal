import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.SUPABASE_SERVICE_KEY ?? "",
  );

  const { data, error } = await supabaseAdmin
    .from("social_handles")
    .select("*")
    .order("platform")
    .order("display_name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

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

  const { action } = body as { action: string };

  if (action === "create") {
    const { platform, handle, display_name, category } = body as Record<
      string,
      string
    >;

    if (!platform || !handle) {
      return NextResponse.json(
        { error: "platform and handle required" },
        { status: 400 },
      );
    }

    const validPlatforms = ["x", "facebook", "rss"];
    if (!validPlatforms.includes(platform)) {
      return NextResponse.json(
        { error: `platform must be one of: ${validPlatforms.join(", ")}` },
        { status: 400 },
      );
    }

    const { data, error } = await supabaseAdmin
      .from("social_handles")
      .insert({
        platform,
        handle: handle.trim(),
        display_name: display_name?.trim() || handle.trim(),
        category: category?.trim() || "general",
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data, { status: 201 });
  }

  if (action === "toggle") {
    const { id, is_active } = body as { id: string; is_active: boolean };
    if (!id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("social_handles")
      .update({ is_active, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  }

  if (action === "delete") {
    const { id } = body as { id: string };
    if (!id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("social_handles")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
