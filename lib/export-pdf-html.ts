import "server-only";

import type { JSONContent } from "@tiptap/core";
import { generateHTML } from "@tiptap/html";
import { Window } from "happy-dom";
import { createEditorExtensions } from "./editor-extensions";

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

/** Print CSS mirroring the on-screen doc paper + ProseMirror styles. */
const PRINT_CSS = `
  * { box-sizing: border-box; }
  html, body {
    margin: 0;
    padding: 0;
    background: #fff;
    color: #202124;
    font-family: Arial, Helvetica, sans-serif;
    font-size: 11pt;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .page {
    width: 816px;
    max-width: 100%;
    margin: 0 auto;
    padding: 56px;
  }
  h1 { font-size: 1.875rem; font-weight: 700; margin: 1.25rem 0 0.75rem; line-height: 1.25; }
  h2 { font-size: 1.375rem; font-weight: 650; margin: 1.1rem 0 0.55rem; line-height: 1.3; }
  h3 { font-size: 1.125rem; font-weight: 600; margin: 1rem 0 0.45rem; }
  h4, h5, h6 { font-weight: 600; margin: 0.85rem 0 0.4rem; }
  p { margin: 0.5rem 0; line-height: 1.5; }
  a { color: #1a73e8; text-decoration: underline; }
  img {
    max-width: 100% !important;
    height: auto !important;
    display: block;
    margin: 0.75rem 0;
    border-radius: 6px;
  }
  table {
    border-collapse: collapse;
    width: 100%;
    margin: 1rem 0;
    table-layout: fixed;
  }
  th, td {
    border: 1px solid #d0d7de;
    padding: 0.5rem 0.75rem;
    vertical-align: top;
    word-break: break-word;
  }
  th { background: #f6f8fa; font-weight: 600; }
  blockquote {
    border-left: 4px solid #d0d7de;
    margin: 0.75rem 0;
    padding: 0.25rem 0 0.25rem 1rem;
    color: #57606a;
  }
  pre {
    background: #f6f8fa;
    border: 1px solid #d0d7de;
    border-radius: 6px;
    padding: 0.75rem 1rem;
    overflow-x: auto;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 13px;
    margin: 0.75rem 0;
    white-space: pre-wrap;
  }
  code {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 0.9em;
    background: #eff1f3;
    padding: 0.1em 0.35em;
    border-radius: 4px;
  }
  pre code { background: transparent; padding: 0; }
  ul { list-style: disc; padding-left: 1.5rem; margin: 0.5rem 0; }
  ol { list-style: decimal; padding-left: 1.5rem; margin: 0.5rem 0; }
  li { margin: 0.2rem 0; }
  hr { border: none; border-top: 1px solid #d0d7de; margin: 1.25rem 0; }
  mark { border-radius: 2px; padding: 0 1px; }
  .doc-title {
    font-size: 1.5rem;
    font-weight: 600;
    margin: 0 0 1.25rem;
    color: #1f2937;
  }
`;

const MAX_INLINE_BYTES = 8 * 1024 * 1024; // 8 MB per image

function extractSrc(attrs: string): string | null {
  const m =
    attrs.match(/\bsrc\s*=\s*"([^"]*)"/i) ||
    attrs.match(/\bsrc\s*=\s*'([^']*)'/i) ||
    attrs.match(/\bsrc\s*=\s*([^\s>]+)/i);
  return m?.[1] ? m[1].trim() : null;
}

function replaceSrc(attrs: string, newSrc: string): string {
  if (/\bsrc\s*=\s*"/i.test(attrs)) {
    return attrs.replace(/\bsrc\s*=\s*"[^"]*"/i, `src="${newSrc}"`);
  }
  if (/\bsrc\s*=\s*'/i.test(attrs)) {
    return attrs.replace(/\bsrc\s*=\s*'[^']*'/i, `src='${newSrc}'`);
  }
  if (/\bsrc\s*=/i.test(attrs)) {
    return attrs.replace(/\bsrc\s*=\s*[^\s>]+/i, `src="${newSrc}"`);
  }
  return `${attrs} src="${newSrc}"`;
}

/** Fetch remote images on our server (follows GitHub→S3 redirects) and embed as data URIs. */
async function fetchAsDataUri(src: string): Promise<string | null> {
  if (!src || src.startsWith("data:")) return src || null;
  if (!/^https?:\/\//i.test(src)) return null;

  try {
    const res = await fetch(src, {
      redirect: "follow",
      headers: {
        Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        "User-Agent":
          "Mozilla/5.0 (compatible; WordcraftPDF/1.0; +https://wordcraft-docs.vercel.app)",
      },
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) {
      console.warn(`PDF image fetch failed ${res.status}: ${src.slice(0, 120)}`);
      return null;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.byteLength === 0 || buf.byteLength > MAX_INLINE_BYTES) return null;
    const ctype =
      res.headers.get("content-type")?.split(";")[0]?.trim() ||
      guessMime(src) ||
      "image/png";
    if (!ctype.startsWith("image/") && ctype !== "application/octet-stream") {
      return null;
    }
    const mime = ctype === "application/octet-stream" ? "image/png" : ctype;
    return `data:${mime};base64,${buf.toString("base64")}`;
  } catch (err) {
    console.warn("PDF image fetch error", src.slice(0, 120), err);
    return null;
  }
}

function guessMime(src: string): string | null {
  const path = src.split("?")[0]?.toLowerCase() ?? "";
  if (path.endsWith(".png")) return "image/png";
  if (path.endsWith(".jpg") || path.endsWith(".jpeg")) return "image/jpeg";
  if (path.endsWith(".gif")) return "image/gif";
  if (path.endsWith(".webp")) return "image/webp";
  if (path.endsWith(".svg")) return "image/svg+xml";
  return null;
}

/**
 * Inline every <img src="http(s):..."> as a data URI so Browserless does not
 * need to fetch GitHub/CDN assets (often blocked or redirect-signed).
 */
export async function inlineRemoteImages(html: string): Promise<string> {
  const tagRe = /<img\b([^>]*)>/gi;
  const jobs: { full: string; attrs: string; src: string }[] = [];
  let m: RegExpExecArray | null;
  while ((m = tagRe.exec(html)) !== null) {
    const attrs = m[1] ?? "";
    const src = extractSrc(attrs);
    if (!src || src.startsWith("data:")) continue;
    jobs.push({ full: m[0], attrs, src });
  }

  if (jobs.length === 0) return html;

  const unique = [...new Set(jobs.map((j) => j.src))];
  const map = new Map<string, string>();
  await Promise.all(
    unique.map(async (src) => {
      const data = await fetchAsDataUri(src);
      if (data) map.set(src, data);
    })
  );

  return html.replace(/<img\b([^>]*)>/gi, (full, attrs: string) => {
    const src = extractSrc(attrs);
    if (!src) return full;
    const data = map.get(src);
    if (!data) return full;
    let next = replaceSrc(attrs, data);
    // Drop crossorigin — breaks non-CORS CDNs when not inlined.
    next = next.replace(
      /\s*crossorigin\s*=\s*("([^"]*)"|'([^']*)'|[^\s>]*)/gi,
      ""
    );
    if (!/\breferrerpolicy=/i.test(next)) {
      next += ' referrerpolicy="no-referrer"';
    }
    return `<img${next}>`;
  });
}

export async function documentJsonToPrintHtml(
  title: string,
  contentJson: JSONContent
): Promise<string> {
  ensureDom();
  const body = generateHTML(contentJson, createEditorExtensions());
  const safeTitle = title.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const content = await inlineRemoteImages(body);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${safeTitle}</title>
  <style>${PRINT_CSS}</style>
</head>
<body>
  <article class="page">
    <h1 class="doc-title">${safeTitle}</h1>
    <div class="doc-body">${content}</div>
  </article>
</body>
</html>`;
}

export async function renderPdfWithBrowserless(
  html: string,
  apiKey: string,
  apiBase?: string
): Promise<ArrayBuffer> {
  const base = (apiBase || "https://production-sfo.browserless.io").replace(
    /\/$/,
    ""
  );
  const url = `${base}/pdf?token=${encodeURIComponent(apiKey)}`;

  // Browserless /pdf: `html` XOR `url`, plus `options` and shared wait helpers.
  // Do NOT send legacy keys like `safeMode` (400: additional properties).
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Cache-Control": "no-cache",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      html,
      // Images are already inlined as data URIs; short settle for layout.
      waitForTimeout: 500,
      options: {
        format: "Letter",
        printBackground: true,
        displayHeaderFooter: false,
        tagged: true,
        margin: {
          top: "0.5in",
          right: "0.5in",
          bottom: "0.5in",
          left: "0.5in",
        },
      },
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Browserless PDF failed (${res.status}): ${text.slice(0, 400) || res.statusText}`
    );
  }

  return res.arrayBuffer();
}
