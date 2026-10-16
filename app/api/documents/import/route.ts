import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { assertFolderOwned } from "@/lib/folders";
import { prisma } from "@/lib/prisma";
import {
  fileToTipTapJson,
  titleFromFilename,
} from "@/lib/import-content";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await request.formData();
  const file = form.get("file");
  const folderIdRaw = form.get("folderId");
  const folderId =
    typeof folderIdRaw === "string" && folderIdRaw.length > 0
      ? folderIdRaw
      : null;

  if (folderId) {
    try {
      await assertFolderOwned(folderId, user.id);
    } catch {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }
  }

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "A file is required." }, { status: 400 });
  }

  const name = file.name || "import.txt";
  const lower = name.toLowerCase();
  if (
    !lower.endsWith(".txt") &&
    !lower.endsWith(".md") &&
    !lower.endsWith(".markdown")
  ) {
    return NextResponse.json(
      {
        error:
          "Unsupported file type. Import accepts .txt and .md only.",
      },
      { status: 400 }
    );
  }

  if (file.size > 1024 * 1024) {
    return NextResponse.json(
      { error: "Import files must be 1 MB or smaller." },
      { status: 400 }
    );
  }

  const raw = await file.text();
  let contentJson;
  try {
    contentJson = fileToTipTapJson(name, raw);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Import failed." },
      { status: 400 }
    );
  }

  const document = await prisma.document.create({
    data: {
      title: titleFromFilename(name),
      ownerId: user.id,
      folderId,
      contentJson,
    },
    select: { id: true, title: true, folderId: true, updatedAt: true },
  });

  return NextResponse.json({ document }, { status: 201 });
}
