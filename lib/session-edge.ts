export type EdgeSession = {
  userId: string;
  email: string;
  exp: number;
};

function base64UrlToBytes(input: string): Uint8Array {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  const binary = atob(padded + pad);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function bytesToBase64Url(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = "";
  for (let i = 0; i < arr.length; i++) binary += String.fromCharCode(arr[i]!);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function utf8ToBase64Url(text: string): string {
  return bytesToBase64Url(new TextEncoder().encode(text));
}

async function hmacSign(secret: string, body: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(body)
  );
  return bytesToBase64Url(sig);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

/**
 * Shared fallback used when SESSION_SECRET is unset.
 * Must stay identical for Edge middleware and Node route handlers —
 * a mismatch signs cookies the middleware cannot verify (login loop).
 */
export const FALLBACK_SESSION_SECRET =
  "docs-assignment-dev-session-secret-key-32chars";

/** Resolve session secret for both Node route handlers and Edge middleware. */
export function resolveSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (secret && secret.length >= 16) return secret;
  // Always fall back so Edge + Node never diverge when the host omits env.
  return FALLBACK_SESSION_SECRET;
}

export async function signSessionToken(
  payload: EdgeSession,
  secret: string
): Promise<string> {
  const body = utf8ToBase64Url(JSON.stringify(payload));
  const sig = await hmacSign(secret, body);
  return `${body}.${sig}`;
}

export async function verifySessionToken(
  token: string,
  secret: string
): Promise<EdgeSession | null> {
  if (!secret) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;

  const expected = await hmacSign(secret, body);
  if (!timingSafeEqual(sig, expected)) return null;

  try {
    const json = new TextDecoder().decode(base64UrlToBytes(body));
    const payload = JSON.parse(json) as EdgeSession;
    if (!payload.userId || !payload.exp || Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}
