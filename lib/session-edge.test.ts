import { describe, expect, it } from "vitest";
import {
  FALLBACK_SESSION_SECRET,
  resolveSessionSecret,
  signSessionToken,
  verifySessionToken,
} from "./session-edge";

describe("session-edge", () => {
  it("falls back to a stable secret when SESSION_SECRET is unset", () => {
    const prev = process.env.SESSION_SECRET;
    delete process.env.SESSION_SECRET;
    expect(resolveSessionSecret()).toBe(FALLBACK_SESSION_SECRET);
    if (prev === undefined) delete process.env.SESSION_SECRET;
    else process.env.SESSION_SECRET = prev;
  });

  it("signs and verifies with the same secret (Edge + Node parity)", async () => {
    const secret = FALLBACK_SESSION_SECRET;
    const token = await signSessionToken(
      {
        userId: "user_1",
        email: "alice@example.com",
        exp: Date.now() + 60_000,
      },
      secret
    );
    const payload = await verifySessionToken(token, secret);
    expect(payload?.userId).toBe("user_1");
    expect(payload?.email).toBe("alice@example.com");
  });

  it("rejects tokens signed with a different secret", async () => {
    const token = await signSessionToken(
      {
        userId: "user_1",
        email: "alice@example.com",
        exp: Date.now() + 60_000,
      },
      "aaaaaaaaaaaaaaaa"
    );
    expect(await verifySessionToken(token, "bbbbbbbbbbbbbbbb")).toBeNull();
  });
});
