"use client";

import { useEffect, useState } from "react";

type UserOption = { id: string; name: string; email: string };
type ShareRow = {
  id: string;
  role: "VIEWER" | "EDITOR";
  user: UserOption;
};

type Props = {
  open: boolean;
  onClose: () => void;
  documentId: string;
  shares: ShareRow[];
  onChanged: () => void;
};

export function ShareDialog({
  open,
  onClose,
  documentId,
  shares,
  onChanged,
}: Props) {
  const [users, setUsers] = useState<UserOption[]>([]);
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState<"editor" | "viewer">("editor");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    void fetch("/api/users")
      .then((r) => r.json())
      .then((data) => {
        setUsers(data.users ?? []);
        if (data.users?.[0]) setUserId(data.users[0].id);
      });
  }, [open]);

  if (!open) return null;

  async function share() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/documents/${documentId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Share failed");
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Share failed");
    } finally {
      setBusy(false);
    }
  }

  async function revoke(targetUserId: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/documents/${documentId}/share?userId=${encodeURIComponent(targetUserId)}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not revoke");
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not revoke");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4">
      <div className="w-full max-w-md rounded-xl bg-paper border border-border p-5 shadow-lg">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg font-semibold text-ink">Share document</h2>
            <p className="text-sm text-ink-muted mt-1">
              Grant access to another seeded user. Viewer is read-only; editor
              can change content and attachments.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-ink-subtle hover:text-ink"
          >
            Close
          </button>
        </div>

        <div className="space-y-3">
          <label className="block text-sm">
            <span className="text-ink-muted">User</span>
            <select
              className="mt-1 w-full rounded-lg border border-border px-3 py-2 bg-paper"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.email})
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm">
            <span className="text-ink-muted">Role</span>
            <select
              className="mt-1 w-full rounded-lg border border-border px-3 py-2 bg-paper"
              value={role}
              onChange={(e) => setRole(e.target.value as "editor" | "viewer")}
            >
              <option value="editor">Editor</option>
              <option value="viewer">Viewer</option>
            </select>
          </label>

          {error && <p className="text-sm text-danger">{error}</p>}

          <button
            type="button"
            disabled={busy || !userId}
            onClick={share}
            className="w-full rounded-lg bg-ink text-paper py-2 font-medium disabled:opacity-50"
          >
            {busy ? "Working…" : "Grant access"}
          </button>
        </div>

        <div className="mt-5 border-t border-border pt-4">
          <h3 className="text-sm font-medium text-ink mb-2">People with access</h3>
          {shares.length === 0 ? (
            <p className="text-sm text-ink-subtle">Not shared with anyone yet.</p>
          ) : (
            <ul className="space-y-2">
              {shares.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between gap-2 text-sm"
                >
                  <div>
                    <div className="font-medium">{s.user.name}</div>
                    <div className="text-ink-subtle text-xs">
                      {s.user.email} · {s.role === "EDITOR" ? "Editor" : "Viewer"}
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => revoke(s.user.id)}
                    className="text-danger text-xs underline"
                  >
                    Revoke
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
