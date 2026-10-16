import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const folder = await prisma.folder.findFirst({
    where: { id, ownerId: user.id },
  });
  if (!folder) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = (await request.json()) as {
    name?: string;
    parentId?: string | null;
  };

  const data: { name?: string; parentId?: string | null } = {};
  if (typeof body.name === "string") {
    const name = body.name.trim();
    if (!name) {
      return NextResponse.json({ error: "Name cannot be empty." }, { status: 400 });
    }
    data.name = name.slice(0, 120);
  }
  if (body.parentId !== undefined) {
    if (body.parentId === id) {
      return NextResponse.json(
        { error: "A folder cannot contain itself." },
        { status: 400 }
      );
    }
    if (body.parentId) {
      const parent = await prisma.folder.findFirst({
        where: { id: body.parentId, ownerId: user.id },
      });
      if (!parent) {
        return NextResponse.json({ error: "Parent not found" }, { status: 404 });
      }
    }
    data.parentId = body.parentId;
  }

  const updated = await prisma.folder.update({
    where: { id },
    data,
    select: { id: true, name: true, parentId: true, updatedAt: true },
  });

  return NextResponse.json({ folder: updated });
}

export async function DELETE(_request: Request, { params }: Params) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const folder = await prisma.folder.findFirst({
    where: { id, ownerId: user.id },
  });
  if (!folder) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Move documents in this folder to parent (or root) before delete
  await prisma.document.updateMany({
    where: { folderId: id, ownerId: user.id },
    data: { folderId: folder.parentId },
  });

  await prisma.folder.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
