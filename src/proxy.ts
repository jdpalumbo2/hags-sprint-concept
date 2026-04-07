import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "sprint_session";

async function isValidSession(token: string): Promise<boolean> {
  const secret = process.env.SESSION_SECRET;
  if (!secret) return false;
  const dotIndex = token.lastIndexOf(".");
  if (dotIndex === -1) return false;
  const teamId = token.slice(0, dotIndex);
  const sig = token.slice(dotIndex + 1);
  if (!teamId || !sig) return false;

  const enc = new TextEncoder();
  const key = await globalThis.crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sigBytes = await globalThis.crypto.subtle.sign(
    "HMAC",
    key,
    enc.encode(teamId)
  );
  const expected = Array.from(new Uint8Array(sigBytes))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return expected === sig;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect /team and /team/* routes
  if (!pathname.startsWith("/team")) {
    return NextResponse.next();
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const valid = await isValidSession(token);
  if (!valid) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/team", "/team/:path*"],
};
