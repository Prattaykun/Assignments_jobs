import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { canEdit, canRead, getDocumentAccess } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import {
  ATTACHMENT_TYPES_LABEL,
  isAllowedAttachment,
  MAX_ATTACHMENT_BYTES,
} from "@/lib/attachments";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const access = await getDocumentAccess(id, user.id);
  if (!canRead(access)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const attachments = await prisma.attachment.findMany({
    where: { documentId: id },
    select: {
      id: true,
      filename: true,
      mimeType: true,
      sizeBytes: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ attachments });
}

export async function POST(request: Request, { params }: Params) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const access = await getDocumentAccess(id, user.id);
  if (!canEdit(access)) {
    return NextResponse.json(
      { error: "You do not have permission to add attachments." },
      { status: 403 }
    );
  }

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "A file is required." }, { status: 400 });
  }

  if (file.size > MAX_ATTACHMENT_BYTES) {
    return NextResponse.json(
      { error: `Attachment too large. Max ${MAX_ATTACHMENT_BYTES / (1024 * 1024)} MB.` },
      { status: 400 }
    );
  }

  if (!isAllowedAttachment(file.name, file.type)) {
    return NextResponse.json(
      {
        error: `Unsupported attachment type. Allowed: ${ATTACHMENT_TYPES_LABEL}.`,
      },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  const attachment = await prisma.attachment.create({
    data: {
      documentId: id,
      filename: file.name.slice(0, 200),
      mimeType: file.type || "application/octet-stream",
      sizeBytes: buffer.length,
      data: buffer,
    },
    select: {
      id: true,
      filename: true,
      mimeType: true,
      sizeBytes: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ attachment }, { status: 201 });
}
