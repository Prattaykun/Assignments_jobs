import { NextResponse } from "next/server";
import { ShareRole } from "@prisma/client";
import { getSessionUser } from "@/lib/auth";
import { canManageShares, getDocumentAccess } from "@/lib/access";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const access = await getDocumentAccess(id, user.id);
  if (!canManageShares(access)) {
    return NextResponse.json(
      { error: "Only the owner can share this document." },
      { status: 403 }
    );
  }

  const body = (await request.json()) as {
    userId?: string;
    email?: string;
    role?: string;
  };

  let targetUserId = body.userId;
  if (!targetUserId && body.email) {
    const found = await prisma.user.findUnique({
      where: { email: body.email.trim().toLowerCase() },
    });
    targetUserId = found?.id;
  }

  if (!targetUserId) {
    return NextResponse.json(
      { error: "Select a user to share with." },
      { status: 400 }
    );
  }

  if (targetUserId === user.id) {
    return NextResponse.json(
      { error: "You already own this document." },
      { status: 400 }
    );
  }

  const role =
    body.role === "VIEWER" || body.role === "viewer"
      ? ShareRole.VIEWER
      : body.role === "EDITOR" || body.role === "editor"
        ? ShareRole.EDITOR
        : null;

  if (!role) {
    return NextResponse.json(
      { error: "Role must be viewer or editor." },
      { status: 400 }
    );
  }

  const target = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!target) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  const share = await prisma.documentShare.upsert({
    where: {
      documentId_userId: { documentId: id, userId: targetUserId },
    },
    create: { documentId: id, userId: targetUserId, role },
    update: { role },
    select: {
      id: true,
      role: true,
      user: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json({ share }, { status: 201 });
}

export async function DELETE(request: Request, { params }: Params) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const access = await getDocumentAccess(id, user.id);
  if (!canManageShares(access)) {
    return NextResponse.json(
      { error: "Only the owner can manage shares." },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "userId is required." }, { status: 400 });
  }

  await prisma.documentShare.deleteMany({
    where: { documentId: id, userId },
  });

  return NextResponse.json({ ok: true });
}
