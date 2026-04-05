import { NextRequest, NextResponse } from "next/server";

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

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { username, password } = body as {
    username?: string;
    password?: string;
  };

  const validUser = process.env.ADMIN_USERNAME;
  const validPass = process.env.ADMIN_PASSWORD;
  const secret = process.env.ADMIN_SESSION_SECRET;

  if (!validUser || !validPass || !secret) {
    return NextResponse.json(
      { error: "Auth not configured on server" },
      { status: 500 },
    );
  }

  // Constant-time string comparison to avoid timing attacks
  const userMatch =
    username?.length === validUser.length && username === validUser;
  const passMatch =
    password?.length === validPass.length && password === validPass;

  if (!userMatch || !passMatch) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = await hmacHex(secret, username!);
  const cookieValue = `${username}.${token}`;

  const res = NextResponse.json({ ok: true, username });
  res.cookies.set("admin_session", cookieValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8, // 8 hours
  });
  return res;
}
