import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { COOKIE_NAME } from "./auth-constants";
import {
  resolveSessionSecret,
  signSessionToken,
  verifySessionToken,
} from "./session-edge";

const MAX_AGE_SECONDS = 60 * 60 * 24 * 14; // 14 days

export function sessionCookieOptions(maxAge = MAX_AGE_SECONDS) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    // HTTPS-only on Vercel; keep unset for local http://localhost.
    secure: process.env.VERCEL === "1",
    path: "/",
    maxAge,
  };
}

export async function createSessionToken(user: {
  id: string;
  email: string;
}) {
  const secret = resolveSessionSecret();
  if (!secret) {
    throw new Error("SESSION_SECRET must be set (min 16 chars)");
  }
  return signSessionToken(
    {
      userId: user.id,
      email: user.email,
      exp: Date.now() + MAX_AGE_SECONDS * 1000,
    },
    secret
  );
}

export async function loginWithPassword(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });
  if (!user) return null;
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return null;

  const token = await createSessionToken(user);

  // Also set via cookies() for server components in the same request tree.
  const jar = await cookies();
  jar.set(COOKIE_NAME, token, sessionCookieOptions());

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    token,
  };
}

export async function logout() {
  const jar = await cookies();
  jar.set(COOKIE_NAME, "", sessionCookieOptions(0));
}

export async function getSessionUser() {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const secret = resolveSessionSecret();
  const payload = await verifySessionToken(token, secret);
  if (!payload) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, email: true, name: true },
  });
  return user;
}
