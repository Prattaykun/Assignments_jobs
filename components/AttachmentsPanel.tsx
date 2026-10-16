"use client";

import { useRef, useState } from "react";
import { ATTACHMENT_TYPES_LABEL } from "@/lib/attachments";

type Attachment = {
  id: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
};

type Props = {
  documentId: string;
  attachments: Attachment[];
  canEdit: boolean;
  onChanged: () => void;
};

export function AttachmentsPanel({
  documentId,
  attachments,
  canEdit,
  onChanged,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function upload(file: File) {
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`/api/documents/${documentId}/attachments`, {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/documents/${documentId}/attachments/${id}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <aside className="rounded-xl border border-border bg-paper p-4">
      <div className="flex items-center justify-between gap-2 mb-3">
        <h2 className="font-semibold text-ink">Attachments</h2>
        {canEdit && (
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className="text-sm rounded-lg border border-border px-2.5 py-1 hover:bg-surface disabled:opacity-50"
          >
            {busy ? "…" : "Upload"}
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept=".pdf,.png,.jpg,.jpeg,.txt,.md"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void upload(f);
            e.target.value = "";
          }}
        />
      </div>
      <p className="text-xs text-ink-subtle mb-3">
        Allowed: {ATTACHMENT_TYPES_LABEL}
      </p>
      {error && <p className="text-sm text-danger mb-2">{error}</p>}
      {attachments.length === 0 ? (
        <p className="text-sm text-ink-subtle">No attachments yet.</p>
      ) : (
        <ul className="space-y-2">
          {attachments.map((a) => (
            <li
              key={a.id}
              className="flex items-start justify-between gap-2 text-sm border border-border rounded-lg px-2.5 py-2"
            >
              <div className="min-w-0">
                <a
                  className="font-medium text-accent underline-offset-2 hover:underline truncate block"
                  href={`/api/documents/${documentId}/attachments/${a.id}`}
                >
                  {a.filename}
                </a>
                <div className="text-xs text-ink-subtle">
                  {(a.sizeBytes / 1024).toFixed(1)} KB
                </div>
              </div>
              {canEdit && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => remove(a.id)}
                  className="text-xs text-danger shrink-0"
                >
                  Remove
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
