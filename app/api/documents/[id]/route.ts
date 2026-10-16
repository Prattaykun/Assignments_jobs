import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { canEdit, canRead, getDocumentAccess } from "@/lib/access";
import { assertFolderOwned } from "@/lib/folders";
import { prisma } from "@/lib/prisma";

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

  const document = await prisma.document.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      contentJson: true,
      folderId: true,
      updatedAt: true,
      ownerId: true,
      owner: { select: { id: true, name: true, email: true } },
      folder: { select: { id: true, name: true } },
      shares: {
        select: {
          id: true,
          role: true,
          user: { select: { id: true, name: true, email: true } },
        },
      },
      attachments: {
        select: {
          id: true,
          filename: true,
          mimeType: true,
          sizeBytes: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!document) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    document,
    access,
    canEdit: canEdit(access),
  });
}

export async function PATCH(request: Request, { params }: Params) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const access = await getDocumentAccess(id, user.id);
  if (!canEdit(access)) {
    return NextResponse.json(
      { error: "You do not have permission to edit this document." },
      { status: 403 }
    );
  }

  const body = (await request.json()) as {
    title?: string;
    contentJson?: unknown;
    folderId?: string | null;
  };

  const data: {
    title?: string;
    contentJson?: object;
    folderId?: string | null;
  } = {};
  if (typeof body.title === "string") {
    const t = body.title.trim();
    if (!t) {
      return NextResponse.json({ error: "Title cannot be empty." }, { status: 400 });
    }
    data.title = t.slice(0, 200);
  }
  if (body.contentJson !== undefined) {
    if (!body.contentJson || typeof body.contentJson !== "object") {
      return NextResponse.json({ error: "Invalid content." }, { status: 400 });
    }
    data.contentJson = body.contentJson as object;
  }
  if (body.folderId !== undefined) {
    if (body.folderId) {
      try {
        await assertFolderOwned(body.folderId, user.id);
      } catch {
        return NextResponse.json({ error: "Folder not found" }, { status: 404 });
      }
    }
    data.folderId = body.folderId;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No changes provided." }, { status: 400 });
  }

  const document = await prisma.document.update({
    where: { id },
    data,
    select: { id: true, title: true, updatedAt: true },
  });

  return NextResponse.json({ document });
}

export async function DELETE(_request: Request, { params }: Params) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const access = await getDocumentAccess(id, user.id);
  if (access !== "owner") {
    return NextResponse.json(
      { error: "Only the owner can delete a document." },
      { status: 403 }
    );
  }

  await prisma.document.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
