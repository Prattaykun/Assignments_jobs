"use client";

import { FormEvent, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

const SEEDED = [
  { email: "alice@example.com", name: "Alice", hint: "Owner persona" },
  { email: "bob@example.com", name: "Bob", hint: "Share recipient" },
];

function LoginForm() {
  const searchParams = useSearchParams();
  const rawNext = searchParams.get("next") || "/documents";
  const next =
    !rawNext || rawNext === "/" || rawNext.startsWith("/login")
      ? "/documents"
      : rawNext;

  const [email, setEmail] = useState("alice@example.com");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }
      // Hard navigation guarantees the new session cookie is sent.
      window.location.assign(next);
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-surface flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <p
          className="text-3xl font-semibold tracking-tight text-ink mb-2"
          style={{ fontFamily: "var(--font-fraunces), serif" }}
        >
          Wordcraft
        </p>
        <p className="text-ink-muted mb-8">
          Sign in with a seeded reviewer account to explore docs, sharing, and
          uploads.
        </p>

        <form
          onSubmit={onSubmit}
          className="bg-paper border border-border rounded-xl p-6 shadow-sm space-y-4"
        >
          <div className="flex gap-2">
            {SEEDED.map((u) => (
              <button
                key={u.email}
                type="button"
                onClick={() => {
                  setEmail(u.email);
                  setPassword("password123");
                }}
                className={`flex-1 text-left rounded-lg border px-3 py-2 text-sm transition ${
                  email === u.email
                    ? "border-accent bg-accent-soft"
                    : "border-border hover:bg-surface"
                }`}
              >
                <div className="font-medium text-ink">{u.name}</div>
                <div className="text-ink-subtle text-xs">{u.hint}</div>
              </button>
            ))}
          </div>

          <label className="block text-sm">
            <span className="text-ink-muted">Email</span>
            <input
              className="mt-1 w-full rounded-lg border border-border px-3 py-2 bg-paper"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
            />
          </label>

          <label className="block text-sm">
            <span className="text-ink-muted">Password</span>
            <input
              type="password"
              className="mt-1 w-full rounded-lg border border-border px-3 py-2 bg-paper"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </label>

          {error && (
            <p className="text-sm text-danger" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-ink text-paper py-2.5 font-medium hover:opacity-90 disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>

          <p className="text-xs text-ink-subtle text-center">
            Both accounts use password <code>password123</code>
          </p>
        </form>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-surface flex items-center justify-center">
          Loading…
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
