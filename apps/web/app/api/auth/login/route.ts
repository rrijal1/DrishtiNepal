import { createHmac } from "crypto";
import { NextRequest, NextResponse } from "next/server";

function signSession(username: string, secret: string): string {
  return createHmac("sha256", secret).update(username).digest("hex");
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

  const token = signSession(username!, secret);
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
