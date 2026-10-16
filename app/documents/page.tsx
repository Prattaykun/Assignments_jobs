import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getFolderBreadcrumbs } from "@/lib/folders";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/AppHeader";
import { DocumentsHome } from "@/components/DocumentsHome";

type Props = {
  searchParams: Promise<{ folderId?: string }>;
};

export default async function DocumentsPage({ searchParams }: Props) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const { folderId: folderIdParam } = await searchParams;
  const folderId = folderIdParam || null;

  if (folderId) {
    const folder = await prisma.folder.findFirst({
      where: { id: folderId, ownerId: user.id },
    });
    if (!folder) redirect("/documents");
  }

  const [crumbs, folders, owned, sharedRows] = await Promise.all([
    getFolderBreadcrumbs(folderId, user.id),
    prisma.folder.findMany({
      where: { ownerId: user.id, parentId: folderId },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        updatedAt: true,
        _count: { select: { children: true, documents: true } },
      },
    }),
    prisma.document.findMany({
      where: { ownerId: user.id, folderId },
      select: {
        id: true,
        title: true,
        folderId: true,
        updatedAt: true,
        owner: { select: { name: true } },
      },
      orderBy: { updatedAt: "desc" },
    }),
    folderId
      ? Promise.resolve([])
      : prisma.documentShare.findMany({
          where: { userId: user.id },
          include: {
            document: {
              select: {
                id: true,
                title: true,
                folderId: true,
                updatedAt: true,
                owner: { select: { name: true } },
              },
            },
          },
          orderBy: { createdAt: "desc" },
        }),
  ]);

  const shared = (
    sharedRows as Array<{
      role: string;
      document: {
        id: string;
        title: string;
        folderId: string | null;
        updatedAt: Date;
        owner: { name: string };
      };
    }>
  ).map((row) => ({
    id: row.document.id,
    title: row.document.title,
    folderId: row.document.folderId,
    updatedAt: row.document.updatedAt.toISOString(),
    ownerName: row.document.owner.name,
    role: row.role,
  }));

  const currentName = crumbs.length ? crumbs[crumbs.length - 1]!.name : "My Drive";

  return (
    <div className="min-h-screen bg-surface">
      <AppHeader userName={user.name} userEmail={user.email} />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-6">
          <h1
            className="text-3xl font-semibold text-ink tracking-tight"
            style={{ fontFamily: "var(--font-fraunces), serif" }}
          >
            {currentName}
          </h1>
          <p className="mt-2 text-ink-muted max-w-2xl">
            Organize with folders (per account), create documents, or import{" "}
            <strong className="font-medium text-ink">.txt / .md</strong>.
          </p>
        </div>

        <DocumentsHome
          folderId={folderId}
          crumbs={crumbs}
          folders={folders.map((f) => ({
            id: f.id,
            name: f.name,
            updatedAt: f.updatedAt.toISOString(),
            childCount: f._count.children,
            docCount: f._count.documents,
          }))}
          owned={owned.map((d) => ({
            id: d.id,
            title: d.title,
            folderId: d.folderId,
            updatedAt: d.updatedAt.toISOString(),
            ownerName: d.owner.name,
          }))}
          shared={shared}
        />

        <p className="mt-10 text-xs text-ink-subtle">
          Need another account?{" "}
          <Link href="/login" className="underline underline-offset-2">
            Switch user
          </Link>
        </p>
      </main>
    </div>
  );
}
