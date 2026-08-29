// Edge-safe (Web Crypto only, no Node `Buffer`/`crypto` module) so this
// works identically in middleware and in the login API route.

export const AUTH_COOKIE_NAME = "mm_auth";
const SIGNED_MESSAGE = "matcha-maps-authed";

function bufferToHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function sign(secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
  ]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(SIGNED_MESSAGE));
  return bufferToHex(sig);
}

export async function makeAuthCookieValue(sharedPassword: string): Promise<string> {
  return sign(sharedPassword);
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}

export async function isValidAuthCookie(value: string | undefined, sharedPassword: string): Promise<boolean> {
  if (!value) return false;
  const expected = await sign(sharedPassword);
  return timingSafeEqualHex(value, expected);
}
