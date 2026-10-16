"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import { DocLogo } from "./toolbar/icons";

type MenuItem =
  | { type: "item"; label: string; shortcut?: string; onClick?: () => void; disabled?: boolean }
  | { type: "sep" };

function Menu({
  label,
  disabled,
  items,
}: {
  label: string;
  disabled?: boolean;
  items: MenuItem[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        disabled={disabled}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setOpen((v) => !v)}
        className="px-2.5 py-1 text-sm rounded text-[#202124] hover:bg-[#f1f3f4] disabled:opacity-40"
      >
        {label}
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-0.5 min-w-[220px] rounded-lg border border-[#dadce0] bg-white py-1 shadow-lg">
          {items.map((item, i) =>
            item.type === "sep" ? (
              <div key={i} className="my-1 h-px bg-[#e8eaed]" />
            ) : (
              <button
                key={i}
                type="button"
                disabled={item.disabled}
                className="flex w-full items-center justify-between gap-6 px-3 py-1.5 text-left text-sm text-[#202124] hover:bg-[#f1f3f4] disabled:opacity-40"
                onClick={() => {
                  item.onClick?.();
                  setOpen(false);
                }}
              >
                <span>{item.label}</span>
                {item.shortcut && (
                  <span className="text-xs text-[#5f6368] font-mono">
                    {item.shortcut}
                  </span>
                )}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}

type Props = {
  title: string;
  onTitleChange: (title: string) => void;
  onTitleBlur: () => void;
  canEdit: boolean;
  statusLabel: string;
  accessLabel: string;
  isOwner: boolean;
  onShare: () => void;
  onSaveNow: () => void;
  editor: Editor | null;
};

export function EditorTitleBar({
  title,
  onTitleChange,
  onTitleBlur,
  canEdit,
  statusLabel,
  accessLabel,
  isOwner,
  onShare,
  onSaveNow,
  editor,
}: Props) {
  const ed = editor;

  return (
    <div
      className="flex items-stretch bg-[#eef1f5] text-[#1f2937] pt-2 pb-1"
      data-testid="title-bar"
      onMouseDown={(e) => {
        const tag = (e.target as HTMLElement).tagName;
        if (!["INPUT", "TEXTAREA", "SELECT", "OPTION"].includes(tag)) {
          e.preventDefault();
        }
      }}
    >
      <div className="flex items-center flex-shrink-0 pl-3 pr-1">
        <Link
          href="/documents"
          className="flex items-center"
          title="Back to documents"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <DocLogo />
        </Link>
      </div>

      <div className="flex flex-col justify-center flex-1 min-w-0 py-1 overflow-hidden">
        <div className="flex items-center gap-2 px-1 min-w-0">
          <input
            value={title}
            disabled={!canEdit}
            onChange={(e) => onTitleChange(e.target.value)}
            onBlur={onTitleBlur}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
            }}
            onMouseDown={(e) => e.stopPropagation()}
            className="text-base font-normal text-[#1f2937] bg-transparent border-0 outline-none px-2 py-0 rounded min-w-[100px] max-w-[360px] hover:bg-[#f1f3f4] focus:bg-white focus:ring-2 focus:ring-[#1a73e8] truncate disabled:opacity-80"
            aria-label="Document name"
          />
          <span className="text-xs text-[#5f6368] hidden sm:inline whitespace-nowrap">
            {statusLabel}
          </span>
          <span className="text-[10px] rounded-full bg-white/80 border border-[#dadce0] px-2 py-0.5 text-[#5f6368] whitespace-nowrap">
            {accessLabel}
          </span>
        </div>

        <div
          className="flex items-center px-1 min-w-0 overflow-x-auto"
          style={{ scrollbarWidth: "none" }}
          role="toolbar"
          aria-label="Document menus"
        >
          <Menu
            label="File"
            disabled={!ed}
            items={[
              {
                type: "item",
                label: "Save now",
                shortcut: "Ctrl+S",
                disabled: !canEdit,
                onClick: onSaveNow,
              },
              { type: "sep" },
              {
                type: "item",
                label: "Print",
                shortcut: "Ctrl+P",
                onClick: () => window.print(),
              },
            ]}
          />
          <Menu
            label="Edit"
            disabled={!ed}
            items={[
              {
                type: "item",
                label: "Undo",
                shortcut: "Ctrl+Z",
                disabled: !ed?.can().undo(),
                onClick: () => ed?.chain().focus().undo().run(),
              },
              {
                type: "item",
                label: "Redo",
                shortcut: "Ctrl+Y",
                disabled: !ed?.can().redo(),
                onClick: () => ed?.chain().focus().redo().run(),
              },
              { type: "sep" },
              {
                type: "item",
                label: "Select all",
                shortcut: "Ctrl+A",
                onClick: () => ed?.chain().focus().selectAll().run(),
              },
            ]}
          />
          <Menu
            label="Format"
            disabled={!ed || !canEdit}
            items={[
              {
                type: "item",
                label: "Bold",
                shortcut: "Ctrl+B",
                onClick: () => ed?.chain().focus().toggleBold().run(),
              },
              {
                type: "item",
                label: "Italic",
                shortcut: "Ctrl+I",
                onClick: () => ed?.chain().focus().toggleItalic().run(),
              },
              {
                type: "item",
                label: "Underline",
                shortcut: "Ctrl+U",
                onClick: () => ed?.chain().focus().toggleUnderline().run(),
              },
              { type: "sep" },
              {
                type: "item",
                label: "Clear formatting",
                onClick: () =>
                  ed?.chain().focus().unsetAllMarks().clearNodes().run(),
              },
            ]}
          />
          <Menu
            label="View"
            items={[
              {
                type: "item",
                label: "Zoom 100%",
                onClick: () => undefined,
              },
            ]}
          />
          <Menu
            label="Insert"
            disabled={!ed || !canEdit}
            items={[
              {
                type: "item",
                label: "Link…",
                shortcut: "Ctrl+K",
                onClick: () => {
                  const url = window.prompt("Link URL", "https://");
                  if (!url) return;
                  ed?.chain().focus().setLink({ href: url }).run();
                },
              },
              {
                type: "item",
                label: "Bullet list",
                onClick: () => ed?.chain().focus().toggleBulletList().run(),
              },
              {
                type: "item",
                label: "Numbered list",
                onClick: () => ed?.chain().focus().toggleOrderedList().run(),
              },
            ]}
          />
          <Menu
            label="Tools"
            items={[
              {
                type: "item",
                label: "Word count",
                onClick: () => {
                  const text = ed?.getText() ?? "";
                  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
                  window.alert(`${words} words · ${text.length} characters`);
                },
              },
            ]}
          />
          <Menu
            label="Help"
            items={[
              {
                type: "item",
                label: "Back to documents",
                onClick: () => {
                  window.location.href = "/documents";
                },
              },
            ]}
          />
        </div>
      </div>

      <div className="flex items-center flex-shrink-0 gap-2 px-3">
        {canEdit && (
          <button
            type="button"
            onClick={onSaveNow}
            onMouseDown={(e) => e.stopPropagation()}
            className="hidden sm:inline-flex text-sm px-3 py-1.5 rounded-full hover:bg-[#f1f3f4] text-[#202124]"
          >
            Save
          </button>
        )}
        {isOwner && (
          <button
            type="button"
            onClick={onShare}
            onMouseDown={(e) => e.stopPropagation()}
            className="inline-flex items-center rounded-full bg-[#1a73e8] text-white text-sm font-medium px-4 py-1.5 hover:bg-[#1557b0]"
          >
            Share
          </button>
        )}
      </div>
    </div>
  );
}
