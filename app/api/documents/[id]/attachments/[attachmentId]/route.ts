import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { canEdit, canRead, getDocumentAccess } from "@/lib/access";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string; attachmentId: string }> };

export async function GET(_request: Request, { params }: Params) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, attachmentId } = await params;
  const access = await getDocumentAccess(id, user.id);
  if (!canRead(access)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const attachment = await prisma.attachment.findFirst({
    where: { id: attachmentId, documentId: id },
  });

  if (!attachment) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(attachment.data), {
    headers: {
      "Content-Type": attachment.mimeType,
      "Content-Disposition": `attachment; filename="${attachment.filename.replace(/"/g, "")}"`,
      "Content-Length": String(attachment.sizeBytes),
    },
  });
}

export async function DELETE(_request: Request, { params }: Params) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, attachmentId } = await params;
  const access = await getDocumentAccess(id, user.id);
  if (!canEdit(access)) {
    return NextResponse.json(
      { error: "You do not have permission to delete attachments." },
      { status: 403 }
    );
  }

  await prisma.attachment.deleteMany({
    where: { id: attachmentId, documentId: id },
  });

  return NextResponse.json({ ok: true });
}
