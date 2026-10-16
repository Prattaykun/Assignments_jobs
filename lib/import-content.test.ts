import { describe, expect, it } from "vitest";
import { fileToTipTapJson } from "./import-content";
import { titleFromFilename } from "./import-constants";

describe("fileToTipTapJson", () => {
  it("imports plain text as paragraphs", () => {
    const doc = fileToTipTapJson("notes.txt", "Hello\nWorld");
    expect(doc.type).toBe("doc");
    expect(doc.content?.length).toBe(2);
    expect(doc.content?.[0]).toMatchObject({
      type: "paragraph",
      content: [{ type: "text", text: "Hello" }],
    });
  });

  it("imports markdown headings and lists", () => {
    const md = `# Title\n\n- one\n- two\n`;
    const doc = fileToTipTapJson("brief.md", md);
    expect(doc.type).toBe("doc");
    const types = (doc.content ?? []).map((n) => n.type);
    expect(types).toContain("heading");
    expect(types.some((t) => t === "bulletList" || t === "paragraph")).toBe(
      true
    );
  });

  it("imports GFM links and images", () => {
    const md =
      `[docs](https://example.com)\n\n![Logo](https://example.com/logo.png)\n`;
    const doc = fileToTipTapJson("readme.md", md);
    const flat = JSON.stringify(doc);
    expect(flat).toContain("example.com");
    expect(flat.includes("image") || flat.includes("logo.png")).toBe(true);
  });

  it("rejects unsupported extensions", () => {
    expect(() => fileToTipTapJson("file.docx", "x")).toThrow(/Unsupported/);
  });
});

describe("titleFromFilename", () => {
  it("strips extension", () => {
    expect(titleFromFilename("Meeting Notes.md")).toBe("Meeting Notes");
  });
});
