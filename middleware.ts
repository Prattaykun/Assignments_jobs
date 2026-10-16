import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { COOKIE_NAME } from "./lib/auth-constants";
import {
  resolveSessionSecret,
  verifySessionToken,
} from "./lib/session-edge";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isLogin = pathname === "/login";
  const isPublic =
    isLogin ||
    pathname.startsWith("/api/auth/login") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico";

  const token = request.cookies.get(COOKIE_NAME)?.value;
  const secret = resolveSessionSecret();
  const session =
    token && secret ? await verifySessionToken(token, secret) : null;

  // Already signed in → skip login page.
  if (isLogin && session) {
    const dest = request.nextUrl.clone();
    dest.pathname = "/documents";
    dest.search = "";
    return NextResponse.redirect(dest);
  }

  if (isPublic) {
    return NextResponse.next();
  }

  if (!session) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    // Prefer /documents over bare / so post-login lands on the home grid.
    const nextPath = pathname === "/" ? "/documents" : pathname;
    loginUrl.searchParams.set("next", nextPath);
    return NextResponse.redirect(loginUrl);
  }

  // Root → documents for authenticated users.
  if (pathname === "/") {
    const dest = request.nextUrl.clone();
    dest.pathname = "/documents";
    return NextResponse.redirect(dest);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
