"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useEditor, EditorContent } from "@tiptap/react";
import type { JSONContent } from "@tiptap/core";
import { EditorToolbar } from "./EditorToolbar";
import { EditorTitleBar } from "./EditorTitleBar";
import { ShareDialog } from "./ShareDialog";
import { AttachmentsPanel } from "./AttachmentsPanel";
import { DocumentsNavBreadcrumb } from "./DocumentsNavBreadcrumb";
import { EditorContextMenu } from "./EditorContextMenu";
import { KeyboardShortcutsDialog } from "./KeyboardShortcutsDialog";
import { LinkDialog } from "./LinkDialog";
import { RemoteCursors } from "./RemoteCursors";
import { createEditorExtensions } from "@/lib/editor-extensions";
import { useEditorShortcuts } from "@/hooks/useEditorShortcuts";
import { useDocumentPresence } from "@/hooks/useDocumentPresence";

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
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [shares, setShares] = useState(initialShares);
  const [attachments, setAttachments] = useState(initialAttachments);
  const [shareOpen, setShareOpen] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [ctxMenu, setCtxMenu] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [linkDialog, setLinkDialog] = useState<{
    url: string;
    text: string;
    hasSelection: boolean;
  } | null>(null);
  const [exportingPdf, setExportingPdf] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const paperRef = useRef<HTMLDivElement>(null);
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

  const openLinkDialog = useCallback(() => {
    if (!editor || !canEdit) return;
    setCtxMenu(null);
    const { from, to, empty } = editor.state.selection;
    const selectedText = empty
      ? ""
      : editor.state.doc.textBetween(from, to, " ");
    const existing =
      (editor.getAttributes("link").href as string | undefined) || "";
    setLinkDialog({
      url: existing || "https://",
      text: selectedText,
      hasSelection: !empty,
    });
  }, [editor, canEdit]);

  const applyLink = useCallback(
    (url: string, text?: string) => {
      if (!editor) return;
      const href = url.trim();
      if (!href) return;

      if (linkDialog?.hasSelection) {
        editor
          .chain()
          .focus()
          .extendMarkRange("link")
          .setLink({ href })
          .run();
      } else {
        const label = (text || href).trim() || href;
        editor
          .chain()
          .focus()
          .insertContent({
            type: "text",
            text: label,
            marks: [{ type: "link", attrs: { href } }],
          })
          .run();
      }
      setLinkDialog(null);
    },
    [editor, linkDialog?.hasSelection]
  );

  const removeLink = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
    setLinkDialog(null);
  }, [editor]);

  async function saveTitle() {
    const next = title.trim();
    if (!next) return;
    await persist({ title: next });
  }

  const saveNow = useCallback(async () => {
    if (!editor) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    await persist({
      title: latestTitle.current.trim() || title,
      contentJson: editor.getJSON(),
    });
  }, [editor, persist, title]);

  useEditorShortcuts({
    editor,
    canEdit,
    onSave: () => void saveNow(),
    onOpenShortcutsHelp: () => setShortcutsOpen(true),
    onInsertLink: openLinkDialog,
  });

  const { peers } = useDocumentPresence({
    documentId,
    editor,
    enabled: true,
  });

  async function exportPdf() {
    setExportingPdf(true);
    setError(null);
    try {
      // Persist latest content so the PDF matches the editor.
      if (canEdit && editor) {
        if (saveTimer.current) clearTimeout(saveTimer.current);
        await persist({
          title: latestTitle.current.trim() || title,
          contentJson: editor.getJSON(),
        });
      }

      const res = await fetch(`/api/documents/${documentId}/export/pdf`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "PDF export failed");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(title || "document").replace(/[^\w\s\-]+/g, "").trim() || "document"}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "PDF export failed");
    } finally {
      setExportingPdf(false);
    }
  }

  async function deleteDocument() {
    if (!isOwner) return;
    if (
      !window.confirm(
        `Move “${title || "Untitled"}” to trash? This cannot be undone.`
      )
    ) {
      return;
    }
    setError(null);
    try {
      const res = await fetch(`/api/documents/${documentId}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Delete failed");
      router.push("/documents");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    }
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
        onDelete={() => void deleteDocument()}
        onExportPdf={() => void exportPdf()}
        exportingPdf={exportingPdf}
        peers={peers}
      />

      <div className="bg-[#eef1f5] pb-1">
        <EditorToolbar
          editor={editor}
          disabled={!canEdit}
          zoom={zoom}
          onZoomChange={setZoom}
          onInsertLink={openLinkDialog}
        />
      </div>

      {error && (
        <p className="mx-4 mt-2 text-sm text-danger bg-paper border border-border rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex-1 overflow-auto">
        {/* w-fit keeps paper + attachments as one group so they stay adjacent */}
        <div className="mx-auto w-fit max-w-full flex flex-col xl:flex-row gap-4 px-4 py-8 items-start">
          <div
            className="shrink-0 origin-top transition-transform"
            style={{
              maxWidth: PAPER_WIDTH_PX,
              width: PAPER_WIDTH_PX,
              transform: `scale(${zoom})`,
              transformOrigin: "top left",
            }}
          >
            <div
              ref={paperRef}
              className="doc-paper relative rounded-sm border border-[#dadce0] bg-white shadow-[0_1px_3px_rgba(60,64,67,0.15)] px-14 py-14 min-h-[70vh] overflow-x-hidden"
              style={{ width: PAPER_WIDTH_PX, maxWidth: PAPER_WIDTH_PX }}
              onContextMenu={(e) => {
                e.preventDefault();
                setCtxMenu({ x: e.clientX, y: e.clientY });
              }}
            >
              <EditorContent editor={editor} className="doc-editor-content" />
              <RemoteCursors
                editor={editor}
                peers={peers}
                containerRef={paperRef}
              />
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

      <EditorContextMenu
        editor={editor}
        canEdit={canEdit}
        open={!!ctxMenu}
        position={ctxMenu ?? { x: 0, y: 0 }}
        onClose={() => setCtxMenu(null)}
        onInsertLink={openLinkDialog}
      />

      <LinkDialog
        open={!!linkDialog}
        initialUrl={linkDialog?.url}
        initialText={linkDialog?.text}
        hasSelection={!!linkDialog?.hasSelection}
        onClose={() => setLinkDialog(null)}
        onApply={applyLink}
        onRemove={removeLink}
      />

      <KeyboardShortcutsDialog
        open={shortcutsOpen}
        onClose={() => setShortcutsOpen(false)}
      />

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
