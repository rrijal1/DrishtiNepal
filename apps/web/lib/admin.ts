import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// ── Admin Supabase client (bypasses RLS) ────────────────────────────────────

export function supabaseAdmin(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.SUPABASE_SERVICE_KEY ?? "",
  );
}

// ── Session verification ────────────────────────────────────────────────────

async function hmacHex(secret: string, data: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function requireAdmin(req: NextRequest): Promise<string | null> {
  const secret = process.env.ADMIN_SESSION_SECRET ?? "";
  if (!secret) return null;
  const cookie = req.cookies.get("admin_session")?.value;
  if (!cookie) return null;
  const dot = cookie.lastIndexOf(".");
  if (dot === -1) return null;
  const username = cookie.slice(0, dot);
  const token = cookie.slice(dot + 1);
  const expected = await hmacHex(secret, username);
  if (token.length !== expected.length) return null;
  let diff = 0;
  for (let i = 0; i < token.length; i++) {
    diff |= token.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return diff === 0 ? username : null;
}

/** Standard 401 response */
export function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
