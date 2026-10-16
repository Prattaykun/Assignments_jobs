"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import {
  FileText,
  Folder,
  FolderPlus,
  Upload,
  FilePlus2,
  Trash2,
} from "lucide-react";
import { IMPORT_ACCEPT, IMPORT_TYPES_LABEL } from "@/lib/import-constants";
import { DocumentsNavBreadcrumb } from "./DocumentsNavBreadcrumb";

type DocItem = {
  id: string;
  title: string;
  updatedAt: string;
  ownerName: string;
  role?: string;
  folderId?: string | null;
};

type FolderItem = {
  id: string;
  name: string;
  updatedAt: string;
  childCount: number;
  docCount: number;
};

type Crumb = { id: string; name: string };

type Props = {
  folderId: string | null;
  crumbs: Crumb[];
  folders: FolderItem[];
  owned: DocItem[];
  shared: DocItem[];
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function DocumentsHome({
  folderId,
  crumbs,
  folders,
  owned,
  shared,
}: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const breadcrumbCrumbs = crumbs.map((c, i) => ({
    id: c.id,
    name: c.name,
    href: i < crumbs.length - 1 ? `/documents?folderId=${c.id}` : undefined,
  }));

  async function createDoc() {
    setBusy("create");
    setError(null);
    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not create document");
      router.push(`/documents/${data.document.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Create failed");
    } finally {
      setBusy(null);
    }
  }

  async function createFolder() {
    const name = window.prompt("Folder name", "New Folder");
    if (!name?.trim()) return;
    setBusy("folder");
    setError(null);
    try {
      const res = await fetch("/api/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), parentId: folderId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not create folder");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Folder create failed");
    } finally {
      setBusy(null);
    }
  }

  async function deleteFolder(id: string, name: string) {
    if (
      !window.confirm(
        `Delete folder “${name}”? Documents inside move up one level.`
      )
    ) {
      return;
    }
    setBusy(`del-${id}`);
    setError(null);
    try {
      const res = await fetch(`/api/folders/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setBusy(null);
    }
  }

  async function deleteDocument(id: string, title: string) {
    if (
      !window.confirm(
        `Delete “${title}”? This cannot be undone.`
      )
    ) {
      return;
    }
    setBusy(`del-doc-${id}`);
    setError(null);
    try {
      const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setBusy(null);
    }
  }

  async function onImport(file: File) {
    setBusy("import");
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      if (folderId) form.append("folderId", folderId);
      const res = await fetch("/api/documents/import", {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Import failed");
      router.push(`/documents/${data.document.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-8">
      <DocumentsNavBreadcrumb crumbs={breadcrumbCrumbs} />

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={createFolder}
          disabled={!!busy}
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-paper px-3 py-2 text-sm font-medium hover:bg-surface shadow-sm"
        >
          <FolderPlus size={16} />
          {busy === "folder" ? "Creating…" : "New Folder"}
        </button>
        <button
          type="button"
          onClick={createDoc}
          disabled={!!busy}
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-paper px-3 py-2 text-sm font-medium hover:bg-surface shadow-sm"
        >
          <FilePlus2 size={16} />
          {busy === "create" ? "Creating…" : "New Document"}
        </button>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={!!busy}
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-paper px-3 py-2 text-sm font-medium hover:bg-surface shadow-sm"
        >
          <Upload size={16} />
          Import {IMPORT_TYPES_LABEL}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept={IMPORT_ACCEPT}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void onImport(f);
            e.target.value = "";
          }}
        />
      </div>

      {error && (
        <p className="text-sm text-danger bg-paper border border-border rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {/* macOS-style Finder grid */}
      <section>
        <h2 className="text-sm font-semibold text-ink-muted uppercase tracking-wide mb-3">
          {folderId ? "This folder" : "My Drive"}
        </h2>
        {folders.length === 0 && owned.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-paper/60 px-6 py-16 text-center">
            <Folder className="mx-auto mb-3 text-ink-subtle" size={40} />
            <p className="text-ink-muted text-sm">
              Empty folder — create a folder or document to get started.
            </p>
          </div>
        ) : (
          <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {folders.map((folder) => (
              <li key={folder.id} className="group relative">
                <Link
                  href={`/documents?folderId=${folder.id}`}
                  className="flex flex-col items-center gap-2 rounded-2xl border border-transparent bg-paper/80 px-3 py-4 text-center shadow-sm hover:border-[#1a73e8]/30 hover:bg-white hover:shadow-md transition"
                >
                  <Folder
                    size={48}
                    className="text-[#f5c518] fill-[#f5c518]/90 drop-shadow-sm"
                    strokeWidth={1.25}
                  />
                  <span className="text-sm font-medium text-ink line-clamp-2 w-full">
                    {folder.name}
                  </span>
                  <span className="text-[11px] text-ink-subtle">
                    {folder.childCount + folder.docCount} items
                  </span>
                </Link>
                <button
                  type="button"
                  title="Delete folder"
                  disabled={!!busy}
                  onClick={() => void deleteFolder(folder.id, folder.name)}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 rounded-md p-1 bg-white/90 border border-border text-danger hover:bg-red-50 transition"
                >
                  <Trash2 size={14} />
                </button>
              </li>
            ))}

            {owned.map((doc) => (
              <li key={doc.id} className="group relative">
                <Link
                  href={`/documents/${doc.id}`}
                  className="flex flex-col items-center gap-2 rounded-2xl border border-transparent bg-paper/80 px-3 py-4 text-center shadow-sm hover:border-[#1a73e8]/30 hover:bg-white hover:shadow-md transition"
                >
                  <div className="relative">
                    <FileText
                      size={48}
                      className="text-[#1a73e8]"
                      strokeWidth={1.25}
                    />
                  </div>
                  <span className="text-sm font-medium text-ink line-clamp-2 w-full">
                    {doc.title}
                  </span>
                  <span className="text-[11px] text-ink-subtle">
                    {formatDate(doc.updatedAt)}
                  </span>
                </Link>
                <button
                  type="button"
                  title="Delete document"
                  disabled={!!busy}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    void deleteDocument(doc.id, doc.title);
                  }}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 rounded-md p-1 bg-white/90 border border-border text-danger hover:bg-red-50 transition"
                >
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {!folderId && (
        <section>
          <h2 className="text-lg font-semibold text-ink mb-3">Shared with you</h2>
          {shared.length === 0 ? (
            <p className="text-sm text-ink-subtle">
              Nothing shared yet. Have Alice share a doc with Bob to demo this
              list.
            </p>
          ) : (
            <ul className="divide-y divide-border rounded-xl border border-border bg-paper overflow-hidden">
              {shared.map((doc) => (
                <li key={doc.id}>
                  <Link
                    href={`/documents/${doc.id}`}
                    className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-surface"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <FileText size={18} className="text-[#1a73e8] shrink-0" />
                      <div className="min-w-0">
                        <div className="font-medium text-ink truncate">
                          {doc.title}
                        </div>
                        <div className="text-xs text-ink-subtle">
                          From {doc.ownerName} · Updated{" "}
                          {formatDate(doc.updatedAt)}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs rounded-full bg-accent-soft px-2 py-1 text-accent shrink-0">
                      {doc.role === "EDITOR" ? "Editor" : "Viewer"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
