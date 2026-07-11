const COOKIE_NAME = "blessing_writer_session";

export const LOCAL_SESSION_COOKIE = COOKIE_NAME;

function getSecret(): string {
  return process.env.WRITER_SESSION_SECRET || "dev-secret";
}

async function hmacHex(value: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(value));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function createLocalSessionToken(): Promise<string> {
  const payload = `writer:${Date.now()}`;
  const signature = await hmacHex(payload);
  return `${payload}.${signature}`;
}

export async function verifyLocalSessionToken(
  token: string | undefined
): Promise<boolean> {
  if (!token) return false;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;
  const expected = await hmacHex(payload);
  if (expected.length !== signature.length) return false;
  let ok = true;
  for (let i = 0; i < expected.length; i += 1) {
    if (expected[i] !== signature[i]) ok = false;
  }
  return ok;
}

export { isSupabaseConfigured } from "@/lib/supabase/env";
