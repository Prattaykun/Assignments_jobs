"use client";

import { useEffect, useRef } from "react";
import type { Editor } from "@tiptap/react";

type Props = {
  editor: Editor | null;
  canEdit: boolean;
  open: boolean;
  position: { x: number; y: number };
  onClose: () => void;
  onInsertLink: () => void;
};

type Item =
  | { type: "sep" }
  | {
      type: "item";
      label: string;
      shortcut?: string;
      disabled?: boolean;
      active?: boolean;
      onClick: () => void;
    };

function isMac() {
  return (
    typeof navigator !== "undefined" &&
    /Mac|iPhone|iPad/.test(navigator.platform)
  );
}

export function EditorContextMenu({
  editor,
  canEdit,
  open,
  position,
  onClose,
  onInsertLink,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const mod = isMac() ? "⌘" : "Ctrl+";

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open || !editor) return null;

  const hasSelection = !editor.state.selection.empty;

  const items: Item[] = [
    {
      type: "item",
      label: "Cut",
      shortcut: `${mod}X`,
      disabled: !canEdit || !hasSelection,
      onClick: () => document.execCommand("cut"),
    },
    {
      type: "item",
      label: "Copy",
      shortcut: `${mod}C`,
      disabled: !hasSelection,
      onClick: () => document.execCommand("copy"),
    },
    {
      type: "item",
      label: "Paste",
      shortcut: `${mod}V`,
      disabled: !canEdit,
      onClick: () => {
        void navigator.clipboard.readText().then((text) => {
          if (text) editor.chain().focus().insertContent(text).run();
        });
      },
    },
    {
      type: "item",
      label: "Paste without formatting",
      shortcut: `${mod}Shift+V`,
      disabled: !canEdit,
      onClick: () => {
        void navigator.clipboard.readText().then((text) => {
          if (text) editor.chain().focus().insertContent(text).run();
        });
      },
    },
    { type: "sep" },
    {
      type: "item",
      label: "Bold",
      shortcut: `${mod}B`,
      disabled: !canEdit,
      active: editor.isActive("bold"),
      onClick: () => editor.chain().focus().toggleBold().run(),
    },
    {
      type: "item",
      label: "Italic",
      shortcut: `${mod}I`,
      disabled: !canEdit,
      active: editor.isActive("italic"),
      onClick: () => editor.chain().focus().toggleItalic().run(),
    },
    {
      type: "item",
      label: "Underline",
      shortcut: `${mod}U`,
      disabled: !canEdit,
      active: editor.isActive("underline"),
      onClick: () => editor.chain().focus().toggleUnderline().run(),
    },
    {
      type: "item",
      label: "Strikethrough",
      shortcut: `${mod}Shift+X`,
      disabled: !canEdit,
      active: editor.isActive("strike"),
      onClick: () => editor.chain().focus().toggleStrike().run(),
    },
    { type: "sep" },
    {
      type: "item",
      label: "Link…",
      shortcut: `${mod}K`,
      disabled: !canEdit,
      active: editor.isActive("link"),
      onClick: onInsertLink,
    },
    {
      type: "item",
      label: "Clear formatting",
      disabled: !canEdit,
      onClick: () =>
        editor.chain().focus().unsetAllMarks().clearNodes().run(),
    },
    { type: "sep" },
    {
      type: "item",
      label: "Align left",
      shortcut: `${mod}L`,
      disabled: !canEdit,
      active: editor.isActive({ textAlign: "left" }),
      onClick: () => editor.chain().focus().setTextAlign("left").run(),
    },
    {
      type: "item",
      label: "Align center",
      shortcut: `${mod}E`,
      disabled: !canEdit,
      active: editor.isActive({ textAlign: "center" }),
      onClick: () => editor.chain().focus().setTextAlign("center").run(),
    },
    {
      type: "item",
      label: "Align right",
      shortcut: `${mod}R`,
      disabled: !canEdit,
      active: editor.isActive({ textAlign: "right" }),
      onClick: () => editor.chain().focus().setTextAlign("right").run(),
    },
    {
      type: "item",
      label: "Justify",
      shortcut: `${mod}J`,
      disabled: !canEdit,
      active: editor.isActive({ textAlign: "justify" }),
      onClick: () => editor.chain().focus().setTextAlign("justify").run(),
    },
    { type: "sep" },
    {
      type: "item",
      label: "Bulleted list",
      disabled: !canEdit,
      active: editor.isActive("bulletList"),
      onClick: () => editor.chain().focus().toggleBulletList().run(),
    },
    {
      type: "item",
      label: "Numbered list",
      disabled: !canEdit,
      active: editor.isActive("orderedList"),
      onClick: () => editor.chain().focus().toggleOrderedList().run(),
    },
    { type: "sep" },
    {
      type: "item",
      label: "Select all",
      shortcut: `${mod}A`,
      onClick: () => editor.chain().focus().selectAll().run(),
    },
  ];

  const maxH = typeof window !== "undefined" ? window.innerHeight - 16 : 600;
  const top = Math.min(position.y, maxH - 40);
  const left = Math.min(
    position.x,
    (typeof window !== "undefined" ? window.innerWidth : 800) - 260
  );

  return (
    <div
      ref={ref}
      role="menu"
      className="fixed z-[100] min-w-[240px] max-h-[min(70vh,520px)] overflow-y-auto rounded-lg border border-[#dadce0] bg-white py-1 shadow-xl"
      style={{ top, left }}
    >
      {items.map((item, i) =>
        item.type === "sep" ? (
          <div key={i} className="my-1 h-px bg-[#e8eaed]" />
        ) : (
          <button
            key={i}
            type="button"
            role="menuitem"
            disabled={item.disabled}
            className="flex w-full items-center justify-between gap-6 px-3 py-1.5 text-left text-sm text-[#202124] hover:bg-[#f1f3f4] disabled:opacity-40"
            onClick={() => {
              item.onClick();
              onClose();
            }}
          >
            <span>
              {item.active ? "✓ " : ""}
              {item.label}
            </span>
            {item.shortcut && (
              <span className="text-xs text-[#5f6368] font-mono shrink-0">
                {item.shortcut}
              </span>
            )}
          </button>
        )
      )}
    </div>
  );
}
