export const IMPORT_ACCEPT = ".txt,.md,.markdown";
export const IMPORT_TYPES_LABEL = ".txt and .md";

export function titleFromFilename(filename: string): string {
  return (
    filename.replace(/\.(txt|md|markdown)$/i, "").trim() || "Imported document"
  );
}
