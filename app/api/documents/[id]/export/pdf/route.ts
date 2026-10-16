import { NextResponse } from "next/server";
import type { JSONContent } from "@tiptap/core";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { canRead, getDocumentAccess } from "@/lib/access";
import {
  documentJsonToPrintHtml,
  renderPdfWithBrowserless,
} from "@/lib/export-pdf-html";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const access = await getDocumentAccess(id, user.id);
  if (!canRead(access)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const apiKey = process.env.BROWSERLESS_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "PDF export is not configured. Set BROWSERLESS_API_KEY on the server.",
      },
      { status: 503 }
    );
  }

  const doc = await prisma.document.findUnique({
    where: { id },
    select: { title: true, contentJson: true },
  });
  if (!doc) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const html = await documentJsonToPrintHtml(
      doc.title || "Untitled",
      (doc.contentJson as JSONContent) ?? { type: "doc", content: [] }
    );
    const pdf = await renderPdfWithBrowserless(
      html,
      apiKey,
      process.env.BROWSERLESS_API_URL
    );

    const safeName =
      (doc.title || "document")
        .replace(/[^\w\s\-]+/g, "")
        .trim()
        .replace(/\s+/g, "-")
        .slice(0, 80) || "document";

    return new NextResponse(pdf, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${safeName}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("PDF export failed", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Could not export PDF.",
      },
      { status: 502 }
    );
  }
}
