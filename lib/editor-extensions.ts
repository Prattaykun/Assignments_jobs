import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import Link from "@tiptap/extension-link";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import Image from "@tiptap/extension-image";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import type { Extensions } from "@tiptap/core";
import {
  TextStyle,
  FontSize,
  FontFamily,
  Color,
  LineHeight,
} from "@/lib/tiptap-extensions";

/** Shared TipTap schema for the editor and markdown import. */
export function createEditorExtensions(options?: {
  placeholder?: string;
}): Extensions {
  const extensions: Extensions = [
    StarterKit.configure({
      // TipTap v3 StarterKit includes these; we configure them below.
      link: false,
      underline: false,
      undoRedo: {
        depth: 200,
      },
      codeBlock: {
        HTMLAttributes: {
          class:
            "rounded-md bg-[#f6f8fa] p-3 font-mono text-[13px] overflow-x-auto border border-[#d0d7de]",
        },
      },
      heading: { levels: [1, 2, 3, 4, 5, 6] },
    }),
    Underline,
    TextStyle,
    FontSize,
    FontFamily,
    Color,
    LineHeight,
    Highlight.configure({ multicolor: true }),
    TextAlign.configure({ types: ["heading", "paragraph"] }),
    Link.configure({
      openOnClick: false,
      autolink: true,
      linkOnPaste: true,
      HTMLAttributes: { class: "text-[#1a73e8] underline" },
    }),
    Image.configure({
      allowBase64: true,
      HTMLAttributes: {
        class: "max-w-full h-auto rounded-md my-3 block",
        // Lets GitHub / CDN assets load when the page referrer is blocked.
        referrerpolicy: "no-referrer",
      },
    }),
    Table.configure({
      resizable: true,
      HTMLAttributes: {
        class: "border-collapse w-full my-4 text-sm table-fixed",
      },
    }),
    TableRow,
    TableHeader.configure({
      HTMLAttributes: {
        class:
          "border border-[#d0d7de] bg-[#f6f8fa] px-3 py-2 text-left font-semibold",
      },
    }),
    TableCell.configure({
      HTMLAttributes: {
        class: "border border-[#d0d7de] px-3 py-2 align-top",
      },
    }),
    Subscript,
    Superscript,
  ];

  if (options?.placeholder !== undefined) {
    extensions.push(
      Placeholder.configure({ placeholder: options.placeholder })
    );
  }

  return extensions;
}
