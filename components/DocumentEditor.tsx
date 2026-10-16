"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import type { JSONContent } from "@tiptap/core";
import { EditorToolbar } from "./EditorToolbar";
import { EditorTitleBar } from "./EditorTitleBar";
import { ShareDialog } from "./ShareDialog";
import { AttachmentsPanel } from "./AttachmentsPanel";
import { DocumentsNavBreadcrumb } from "./DocumentsNavBreadcrumb";
import { createEditorExtensions } from "@/lib/editor-extensions";

type ShareRow = {
  id: string;
  role: "VIEWER" | "EDITOR";
  user: { id: string; name: string; email: string };
};

type Attachment = {
  id: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
};

type FolderCrumb = { id: string; name: string };

type Props = {
  documentId: string;
  initialTitle: string;
  initialContent: JSONContent;
  canEdit: boolean;
  isOwner: boolean;
  initialShares: ShareRow[];
  initialAttachments: Attachment[];
  accessLabel: string;
  folderCrumbs?: FolderCrumb[];
};

type SaveState = "idle" | "saving" | "saved" | "error";

/** Letter-size page width — content never stretches indefinitely. */
const PAPER_WIDTH_PX = 816;

export function DocumentEditor({
  documentId,
  initialTitle,
  initialContent,
  canEdit,
  isOwner,
  initialShares,
  initialAttachments,
  accessLabel,
  folderCrumbs = [],
}: Props) {
  const [title, setTitle] = useState(initialTitle);
  const [shares, setShares] = useState(initialShares);
  const [attachments, setAttachments] = useState(initialAttachments);
  const [shareOpen, setShareOpen] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestTitle = useRef(title);
  latestTitle.current = title;

  const extensions = useMemo(
    () =>
      createEditorExtensions({
        placeholder: canEdit
          ? "Start writing…"
          : "View-only — ask the owner for edit access.",
      }),
    [canEdit]
  );

  const persist = useCallback(
    async (payload: { title?: string; contentJson?: JSONContent }) => {
      if (!canEdit) return;
      setSaveState("saving");
      setError(null);
      try {
        const res = await fetch(`/api/documents/${documentId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Save failed");
        setSaveState("saved");
      } catch (e) {
        setSaveState("error");
        setError(e instanceof Error ? e.message : "Save failed");
      }
    },
    [canEdit, documentId]
  );

  const scheduleContentSave = useCallback(
    (contentJson: JSONContent) => {
      if (!canEdit) return;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        void persist({ contentJson });
      }, 800);
    },
    [canEdit, persist]
  );

  const editor = useEditor({
    extensions,
    content: initialContent,
    editable: canEdit,
    immediatelyRender: false,
    onUpdate: ({ editor: ed }) => {
      scheduleContentSave(ed.getJSON());
    },
  });

  useEffect(() => {
    editor?.setEditable(canEdit);
  }, [editor, canEdit]);

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  async function saveTitle() {
    const next = title.trim();
    if (!next) return;
    await persist({ title: next });
  }

  async function saveNow() {
    if (!editor) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    await persist({
      title: latestTitle.current.trim() || title,
      contentJson: editor.getJSON(),
    });
  }

  async function refreshMeta() {
    const res = await fetch(`/api/documents/${documentId}`);
    const data = await res.json();
    if (!res.ok) return;
    setShares(data.document.shares ?? []);
    setAttachments(
      (data.document.attachments ?? []).map(
        (a: Attachment & { createdAt: string }) => ({
          ...a,
          createdAt:
            typeof a.createdAt === "string"
              ? a.createdAt
              : new Date(a.createdAt).toISOString(),
        })
      )
    );
  }

  const statusLabel =
    saveState === "saving"
      ? "Saving…"
      : saveState === "saved"
        ? "All changes saved"
        : saveState === "error"
          ? "Save failed"
          : canEdit
            ? "All changes saved"
            : "View only";

  return (
    <div className="min-h-screen flex flex-col bg-[#f8f9fa]">
      <div className="bg-[#eef1f5] px-4 pt-3 pb-0 border-b border-[#dadce0]/60">
        <DocumentsNavBreadcrumb
          crumbs={folderCrumbs.map((c) => ({
            id: c.id,
            name: c.name,
            href: `/documents?folderId=${c.id}`,
          }))}
          currentLabel={title || "Untitled"}
          currentIcon="file"
        />
      </div>
      <EditorTitleBar
        title={title}
        onTitleChange={setTitle}
        onTitleBlur={() => void saveTitle()}
        canEdit={canEdit}
        statusLabel={statusLabel}
        accessLabel={accessLabel}
        isOwner={isOwner}
        onShare={() => setShareOpen(true)}
        onSaveNow={() => void saveNow()}
        editor={editor}
      />

      <div className="bg-[#eef1f5] pb-1">
        <EditorToolbar
          editor={editor}
          disabled={!canEdit}
          zoom={zoom}
          onZoomChange={setZoom}
        />
      </div>

      {error && (
        <p className="mx-4 mt-2 text-sm text-danger bg-paper border border-border rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex-1 overflow-auto">
        <div className="mx-auto flex flex-col xl:flex-row gap-6 px-4 py-8 items-start justify-center">
          <div
            className="w-full shrink-0 origin-top transition-transform mx-auto"
            style={{
              maxWidth: PAPER_WIDTH_PX,
              width: PAPER_WIDTH_PX,
              transform: `scale(${zoom})`,
              transformOrigin: "top center",
            }}
          >
            <div
              className="doc-paper rounded-sm border border-[#dadce0] bg-white shadow-[0_1px_3px_rgba(60,64,67,0.15)] px-14 py-14 min-h-[70vh] overflow-x-hidden"
              style={{ width: PAPER_WIDTH_PX, maxWidth: PAPER_WIDTH_PX }}
            >
              <EditorContent editor={editor} className="doc-editor-content" />
            </div>
          </div>
          <div className="w-full xl:w-[280px] shrink-0 xl:sticky xl:top-4">
            <AttachmentsPanel
              documentId={documentId}
              attachments={attachments}
              canEdit={canEdit}
              onChanged={() => void refreshMeta()}
            />
          </div>
        </div>
      </div>

      <ShareDialog
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        documentId={documentId}
        shares={shares}
        onChanged={() => void refreshMeta()}
      />
    </div>
  );
}
