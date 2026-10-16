import { redirect, notFound } from "next/navigation";
import type { JSONContent } from "@tiptap/core";
import { getSessionUser } from "@/lib/auth";
import {
  canEdit,
  canRead,
  getDocumentAccess,
} from "@/lib/access";
import { getFolderBreadcrumbs } from "@/lib/folders";
import { prisma } from "@/lib/prisma";
import { DocumentEditor } from "@/components/DocumentEditor";
import { EMPTY_DOCUMENT } from "@/lib/empty-document";

type Props = { params: Promise<{ id: string }> };

export default async function DocumentPage({ params }: Props) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const access = await getDocumentAccess(id, user.id);
  if (!canRead(access)) notFound();

  const document = await prisma.document.findUnique({
    where: { id },
    include: {
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

  if (!document) notFound();

  const content =
    (document.contentJson as JSONContent | null) ?? EMPTY_DOCUMENT;

  const accessLabel =
    access === "owner"
      ? "Owner"
      : access === "editor"
        ? "Shared · Editor"
        : "Shared · Viewer";

  const folderCrumbs =
    access === "owner" && document.folderId
      ? await getFolderBreadcrumbs(document.folderId, user.id)
      : [];

  return (
    <DocumentEditor
      documentId={document.id}
      initialTitle={document.title}
      initialContent={content}
      canEdit={canEdit(access)}
      isOwner={access === "owner"}
      accessLabel={accessLabel}
      folderCrumbs={folderCrumbs}
      initialShares={document.shares}
      initialAttachments={document.attachments.map((a) => ({
        ...a,
        createdAt: a.createdAt.toISOString(),
      }))}
    />
  );
}
