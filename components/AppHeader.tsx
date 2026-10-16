"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

type Props = {
  userName: string;
  userEmail: string;
};

export function AppHeader({ userName, userEmail }: Props) {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <header className="border-b border-border bg-paper/90 backdrop-blur sticky top-0 z-20">
      <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between gap-4">
        <Link
          href="/documents"
          className="text-xl font-semibold tracking-tight text-ink"
          style={{ fontFamily: "var(--font-fraunces), serif" }}
        >
          Wordcraft
        </Link>
        <div className="flex items-center gap-3 text-sm">
          <div className="text-right hidden sm:block">
            <div className="font-medium text-ink">{userName}</div>
            <div className="text-ink-subtle text-xs">{userEmail}</div>
          </div>
          <button
            type="button"
            onClick={logout}
            className="rounded-lg border border-border px-3 py-1.5 hover:bg-surface"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
