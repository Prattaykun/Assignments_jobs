import "server-only";

import type { JSONContent } from "@tiptap/core";
import { generateJSON } from "@tiptap/html";
import { marked } from "marked";
import { Window } from "happy-dom";
import { EMPTY_DOCUMENT } from "./empty-document";
import { createEditorExtensions } from "./editor-extensions";

export { titleFromFilename } from "./import-constants";
export {
  IMPORT_ACCEPT,
  IMPORT_TYPES_LABEL,
} from "./import-constants";

function ensureDom() {
  if (typeof globalThis.document !== "undefined") return;
  const window = new Window({ url: "https://wordcraft.local/" });
  (globalThis as unknown as { window: Window }).window = window;
  (globalThis as unknown as { document: Document }).document =
    window.document as unknown as Document;
  (globalThis as unknown as { HTMLElement: typeof window.HTMLElement }).HTMLElement =
    window.HTMLElement;
  (globalThis as unknown as { Node: typeof window.Node }).Node = window.Node;
  (globalThis as unknown as {
    DocumentFragment: typeof window.DocumentFragment;
  }).DocumentFragment = window.DocumentFragment;
}

function textToDoc(text: string): JSONContent {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const content = lines.map((line) => ({
    type: "paragraph" as const,
    content: line.length
      ? [{ type: "text" as const, text: line }]
      : undefined,
  }));

  return {
    type: "doc",
    content: content.length ? content : EMPTY_DOCUMENT.content,
  };
}

function normalizeGithubHtml(html: string): string {
  return html
    .replace(/<\/?picture[^>]*>/gi, "")
    .replace(/<source[^>]*>/gi, "")
    .replace(
      /<div[^>]*align=["']?center["']?[^>]*>/gi,
      '<p style="text-align:center">'
    )
    .replace(/<\/div>/gi, "</p>")
    .replace(/(?:<br\s*\/?>\s*){2,}/gi, "</p><p>")
    .replace(/<br\s*\/?>/gi, "<br>");
}

function markdownToDoc(md: string): JSONContent {
  ensureDom();

  marked.setOptions({
    gfm: true,
    breaks: false,
  });

  const rawHtml = marked.parse(md, { async: false }) as string;
  const html = normalizeGithubHtml(rawHtml);

  try {
    const json = generateJSON(html, createEditorExtensions()) as JSONContent;
    if (!json.content || json.content.length === 0) {
      return EMPTY_DOCUMENT;
    }
    return json;
  } catch (err) {
    console.error("GFM import failed, falling back to plain text", err);
    return textToDoc(md);
  }
}

export function fileToTipTapJson(
  filename: string,
  raw: string
): JSONContent {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".md") || lower.endsWith(".markdown")) {
    return markdownToDoc(raw);
  }

  if (lower.endsWith(".txt")) {
    return textToDoc(raw);
  }

  throw new Error(
    "Unsupported file type. Only .txt and .md are allowed for import."
  );
}
