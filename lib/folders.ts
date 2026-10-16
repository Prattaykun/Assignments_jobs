import { prisma } from "./prisma";

export type FolderCrumb = { id: string; name: string };

export async function getFolderBreadcrumbs(
  folderId: string | null,
  ownerId: string
): Promise<FolderCrumb[]> {
  if (!folderId) return [];

  const crumbs: FolderCrumb[] = [];
  let currentId: string | null = folderId;

  while (currentId) {
    const folder: { id: string; name: string; parentId: string | null; ownerId: string } | null =
      await prisma.folder.findUnique({
        where: { id: currentId },
        select: { id: true, name: true, parentId: true, ownerId: true },
      });
    if (!folder || folder.ownerId !== ownerId) break;
    crumbs.unshift({ id: folder.id, name: folder.name });
    currentId = folder.parentId;
  }

  return crumbs;
}

export async function assertFolderOwned(
  folderId: string | null | undefined,
  ownerId: string
) {
  if (!folderId) return null;
  const folder = await prisma.folder.findFirst({
    where: { id: folderId, ownerId },
  });
  if (!folder) {
    throw new Error("Folder not found");
  }
  return folder;
}
