import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const PROTECTED = ["/moderate", "/admin"];

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

async function verifySession(
  cookie: string | undefined,
  secret: string,
): Promise<string | null> {
  if (!cookie) return null;
  const dot = cookie.lastIndexOf(".");
  if (dot === -1) return null;
  const username = cookie.slice(0, dot);
  const token = cookie.slice(dot + 1);
  const expected = await hmacHex(secret, username);
  // Constant-time compare
  if (token.length !== expected.length) return null;
  let diff = 0;
  for (let i = 0; i < token.length; i++) {
    diff |= token.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return diff === 0 ? username : null;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isProtected = PROTECTED.some((p) => pathname.startsWith(p));

  if (!isProtected) return NextResponse.next();

  const secret = process.env.ADMIN_SESSION_SECRET ?? "";
  const cookie = req.cookies.get("admin_session")?.value;
  const username = secret ? await verifySession(cookie, secret) : null;

  if (!username) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Pass verified username as a header so server components can read it
  const res = NextResponse.next();
  res.headers.set("x-admin-user", username);
  return res;
}

export const config = {
  matcher: ["/moderate/:path*", "/admin/:path*"],
};
