import { ShareRole } from "@prisma/client";
import { prisma } from "./prisma";

export type AccessLevel = "owner" | "editor" | "viewer" | null;

export async function getDocumentAccess(
  documentId: string,
  userId: string
): Promise<AccessLevel> {
  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    select: {
      ownerId: true,
      shares: {
        where: { userId },
        select: { role: true },
        take: 1,
      },
    },
  });

  if (!doc) return null;
  if (doc.ownerId === userId) return "owner";
  const share = doc.shares[0];
  if (!share) return null;
  return share.role === ShareRole.EDITOR ? "editor" : "viewer";
}

export function canEdit(access: AccessLevel): boolean {
  return access === "owner" || access === "editor";
}

export function canManageShares(access: AccessLevel): boolean {
  return access === "owner";
}

export function canRead(access: AccessLevel): boolean {
  return access === "owner" || access === "editor" || access === "viewer";
}
