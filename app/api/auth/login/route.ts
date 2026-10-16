import { NextResponse } from "next/server";
import {
  loginWithPassword,
  sessionCookieOptions,
} from "@/lib/auth";
import { COOKIE_NAME } from "@/lib/auth-constants";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
    };
    const email = body.email?.trim().toLowerCase();
    const password = body.password ?? "";

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    const user = await loginWithPassword(email, password);
    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    // Critically: attach Set-Cookie on the Response so the browser stores it.
    const response = NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name },
    });
    response.cookies.set(COOKIE_NAME, user.token, sessionCookieOptions());
    return response;
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Login failed." }, { status: 500 });
  }
}
