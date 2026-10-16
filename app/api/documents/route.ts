import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { assertFolderOwned } from "@/lib/folders";
import { prisma } from "@/lib/prisma";
import { EMPTY_DOCUMENT } from "@/lib/empty-document";

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const folderId = searchParams.get("folderId");
  const scope = searchParams.get("scope"); // "folder" | "all" | null

  if (scope === "folder" || folderId !== null) {
    try {
      if (folderId) await assertFolderOwned(folderId, user.id);
    } catch {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    const owned = await prisma.document.findMany({
      where: {
        ownerId: user.id,
        folderId: folderId || null,
      },
      select: {
        id: true,
        title: true,
        folderId: true,
        updatedAt: true,
        owner: { select: { id: true, name: true, email: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ owned, shared: [] });
  }

  const [owned, sharedRows] = await Promise.all([
    prisma.document.findMany({
      where: { ownerId: user.id },
      select: {
        id: true,
        title: true,
        folderId: true,
        updatedAt: true,
        owner: { select: { id: true, name: true, email: true } },
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.documentShare.findMany({
      where: { userId: user.id },
      include: {
        document: {
          select: {
            id: true,
            title: true,
            folderId: true,
            updatedAt: true,
            owner: { select: { id: true, name: true, email: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const shared = sharedRows.map((row) => ({
    ...row.document,
    role: row.role,
  }));

  return NextResponse.json({ owned, shared });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let title = "Untitled document";
  let folderId: string | null = null;
  try {
    const body = (await request.json()) as {
      title?: string;
      folderId?: string | null;
    };
    if (body.title?.trim()) title = body.title.trim().slice(0, 200);
    if (body.folderId) folderId = body.folderId;
  } catch {
    // empty body is fine
  }

  try {
    if (folderId) await assertFolderOwned(folderId, user.id);
  } catch {
    return NextResponse.json({ error: "Folder not found" }, { status: 404 });
  }

  const doc = await prisma.document.create({
    data: {
      title,
      ownerId: user.id,
      folderId,
      contentJson: EMPTY_DOCUMENT,
    },
    select: { id: true, title: true, folderId: true, updatedAt: true },
  });

  return NextResponse.json({ document: doc }, { status: 201 });
}
