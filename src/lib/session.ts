import { cookies } from "next/headers";

const COOKIE_NAME = "sprint_session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days in seconds

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET env var is not set");
  return secret;
}

async function sign(data: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await globalThis.crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await globalThis.crypto.subtle.sign(
    "HMAC",
    key,
    enc.encode(data)
  );
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function verify(
  data: string,
  sig: string,
  secret: string
): Promise<boolean> {
  const expected = await sign(data, secret);
  return expected === sig;
}

export async function createSession(teamId: string): Promise<void> {
  const secret = getSecret();
  const sig = await sign(teamId, secret);
  const token = `${teamId}.${sig}`;
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MAX_AGE,
    path: "/",
  });
}

export async function getSession(): Promise<string | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(COOKIE_NAME)?.value;
  if (!raw) return null;
  const dotIndex = raw.lastIndexOf(".");
  if (dotIndex === -1) return null;
  const teamId = raw.slice(0, dotIndex);
  const sig = raw.slice(dotIndex + 1);
  const secret = getSecret();
  const valid = await verify(teamId, sig, secret);
  return valid ? teamId : null;
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
