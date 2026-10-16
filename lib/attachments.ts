export const MAX_ATTACHMENT_BYTES = 2 * 1024 * 1024; // 2 MB

export const ALLOWED_ATTACHMENT_MIME = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "text/plain",
  "text/markdown",
  "text/x-markdown",
]);

export const ALLOWED_ATTACHMENT_EXT = new Set([
  ".pdf",
  ".png",
  ".jpg",
  ".jpeg",
  ".txt",
  ".md",
]);

export const ATTACHMENT_TYPES_LABEL = "pdf, png, jpg, txt, md (max 2 MB)";

export function isAllowedAttachment(filename: string, mimeType: string): boolean {
  const lower = filename.toLowerCase();
  const ext = lower.includes(".") ? lower.slice(lower.lastIndexOf(".")) : "";
  if (ALLOWED_ATTACHMENT_EXT.has(ext)) return true;
  return ALLOWED_ATTACHMENT_MIME.has(mimeType);
}
