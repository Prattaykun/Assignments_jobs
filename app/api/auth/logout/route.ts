import { NextResponse } from "next/server";
import { logout, sessionCookieOptions } from "@/lib/auth";
import { COOKIE_NAME } from "@/lib/auth-constants";

export async function POST() {
  await logout();
  const response = NextResponse.json({ ok: true });
  response.cookies.set(COOKIE_NAME, "", sessionCookieOptions(0));
  return response;
}
