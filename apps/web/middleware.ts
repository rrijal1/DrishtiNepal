import { createHmac } from "crypto";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const PROTECTED = ["/moderate", "/admin"];

function verifySession(
  cookie: string | undefined,
  secret: string,
): string | null {
  if (!cookie) return null;
  const dot = cookie.lastIndexOf(".");
  if (dot === -1) return null;
  const username = cookie.slice(0, dot);
  const token = cookie.slice(dot + 1);
  const expected = createHmac("sha256", secret).update(username).digest("hex");
  // Constant-time compare
  if (token.length !== expected.length) return null;
  let diff = 0;
  for (let i = 0; i < token.length; i++) {
    diff |= token.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return diff === 0 ? username : null;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isProtected = PROTECTED.some((p) => pathname.startsWith(p));

  if (!isProtected) return NextResponse.next();

  const secret = process.env.ADMIN_SESSION_SECRET ?? "";
  const cookie = req.cookies.get("admin_session")?.value;
  const username = secret ? verifySession(cookie, secret) : null;

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
