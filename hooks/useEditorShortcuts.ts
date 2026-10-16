"use client";

import { useEffect } from "react";
import type { Editor } from "@tiptap/react";

type Options = {
  editor: Editor | null;
  canEdit: boolean;
  onSave?: () => void;
  onOpenShortcutsHelp?: () => void;
  onInsertLink?: () => void;
};

function isMod(e: KeyboardEvent) {
  return e.metaKey || e.ctrlKey;
}

function isInTitleOrChromeInput(target: EventTarget | null, editor: Editor) {
  if (!(target instanceof HTMLElement)) return false;
  if (editor.view.dom.contains(target)) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

/**
 * Docs-style keyboard shortcuts. Undo/redo are handled explicitly so the
 * browser cannot steal ⌘/Ctrl+Z before TipTap's history runs.
 */
export function useEditorShortcuts({
  editor,
  canEdit,
  onSave,
  onOpenShortcutsHelp,
  onInsertLink,
}: Options) {
  useEffect(() => {
    if (!editor) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (isInTitleOrChromeInput(e.target, editor)) return;

      const key = e.key.toLowerCase();
      const mod = isMod(e);

      // ⌘/Ctrl+Z undo · ⌘/Ctrl+Shift+Z or Ctrl+Y redo — capture before browser.
      if (mod && key === "z") {
        e.preventDefault();
        e.stopPropagation();
        if (!canEdit) return;
        if (e.shiftKey) {
          if (editor.can().redo()) editor.chain().focus().redo().run();
        } else if (editor.can().undo()) {
          editor.chain().focus().undo().run();
        }
        return;
      }
      if (mod && key === "y" && !e.metaKey) {
        e.preventDefault();
        e.stopPropagation();
        if (canEdit && editor.can().redo()) {
          editor.chain().focus().redo().run();
        }
        return;
      }

      // Ctrl+/ — keyboard shortcuts help (Docs)
      if (mod && key === "/") {
        e.preventDefault();
        onOpenShortcutsHelp?.();
        return;
      }

      // Ctrl+S — save
      if (mod && key === "s") {
        e.preventDefault();
        if (canEdit) onSave?.();
        return;
      }

      // Ctrl+P — print
      if (mod && key === "p") {
        e.preventDefault();
        window.print();
        return;
      }

      if (!canEdit || !mod) return;

      // Ctrl+K — open link dialog
      if (key === "k") {
        e.preventDefault();
        onInsertLink?.();
        return;
      }

      if (e.shiftKey && key === "x") {
        e.preventDefault();
        editor.chain().focus().toggleStrike().run();
        return;
      }

      if (key === "l" && !e.shiftKey) {
        e.preventDefault();
        editor.chain().focus().setTextAlign("left").run();
        return;
      }
      if (key === "e" && !e.shiftKey) {
        e.preventDefault();
        editor.chain().focus().setTextAlign("center").run();
        return;
      }
      if (key === "r" && !e.shiftKey) {
        e.preventDefault();
        editor.chain().focus().setTextAlign("right").run();
        return;
      }
      if (key === "j" && !e.shiftKey) {
        e.preventDefault();
        editor.chain().focus().setTextAlign("justify").run();
        return;
      }

      // Ctrl+Shift+= superscript ; Ctrl+= subscript (Docs)
      if (e.shiftKey && (key === "=" || key === "+")) {
        e.preventDefault();
        editor.chain().focus().toggleSuperscript().run();
        return;
      }
      if (!e.shiftKey && key === "=") {
        e.preventDefault();
        editor.chain().focus().toggleSubscript().run();
      }
    };

    // Capture phase so we win over browser undo / other listeners.
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [editor, canEdit, onSave, onOpenShortcutsHelp, onInsertLink]);
}
