import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { assertFolderOwned } from "@/lib/folders";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const parentId = searchParams.get("parentId");

  try {
    if (parentId) {
      await assertFolderOwned(parentId, user.id);
    }
  } catch {
    return NextResponse.json({ error: "Folder not found" }, { status: 404 });
  }

  const folders = await prisma.folder.findMany({
    where: {
      ownerId: user.id,
      parentId: parentId ? parentId : null,
    },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      parentId: true,
      updatedAt: true,
      _count: { select: { children: true, documents: true } },
    },
  });

  return NextResponse.json({ folders });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    name?: string;
    parentId?: string | null;
  };

  const name = body.name?.trim();
  if (!name) {
    return NextResponse.json({ error: "Folder name is required." }, { status: 400 });
  }

  try {
    if (body.parentId) {
      await assertFolderOwned(body.parentId, user.id);
    }
  } catch {
    return NextResponse.json({ error: "Parent folder not found" }, { status: 404 });
  }

  const folder = await prisma.folder.create({
    data: {
      name: name.slice(0, 120),
      ownerId: user.id,
      parentId: body.parentId || null,
    },
    select: { id: true, name: true, parentId: true, updatedAt: true },
  });

  return NextResponse.json({ folder }, { status: 201 });
}
