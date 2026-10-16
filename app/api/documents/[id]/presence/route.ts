import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { canRead, getDocumentAccess } from "@/lib/access";

type Params = { params: Promise<{ id: string }> };

/** Presence older than this is deleted on every request (temp logs). */
const STALE_MS = 30_000;

const PEER_COLORS = [
  "#e37400",
  "#188038",
  "#d93025",
  "#9334e6",
  "#1967d2",
  "#c5221f",
  "#137333",
];

function colorForUser(userId: string) {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) >>> 0;
  }
  return PEER_COLORS[hash % PEER_COLORS.length]!;
}

async function purgeStale(documentId?: string) {
  const cutoff = new Date(Date.now() - STALE_MS);
  await prisma.documentPresence.deleteMany({
    where: {
      lastSeenAt: { lt: cutoff },
      ...(documentId ? { documentId } : {}),
    },
  });
}

function serializePeers(
  rows: {
    cursorFrom: number;
    cursorTo: number;
    lastSeenAt: Date;
    user: { id: string; name: string; email: string };
  }[],
  selfId: string
) {
  return rows
    .filter((r) => r.user.id !== selfId)
    .map((r) => ({
      userId: r.user.id,
      name: r.user.name,
      email: r.user.email,
      cursorFrom: r.cursorFrom,
      cursorTo: r.cursorTo,
      lastSeenAt: r.lastSeenAt.toISOString(),
      color: colorForUser(r.user.id),
    }));
}

/** Heartbeat: upsert self presence, purge stale, return other peers. */
export async function POST(request: Request, { params }: Params) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const access = await getDocumentAccess(id, user.id);
  if (!canRead(access)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let cursorFrom = 1;
  let cursorTo = 1;
  try {
    const body = (await request.json()) as {
      cursorFrom?: number;
      cursorTo?: number;
    };
    if (typeof body.cursorFrom === "number" && Number.isFinite(body.cursorFrom)) {
      cursorFrom = Math.max(0, Math.floor(body.cursorFrom));
    }
    if (typeof body.cursorTo === "number" && Number.isFinite(body.cursorTo)) {
      cursorTo = Math.max(0, Math.floor(body.cursorTo));
    }
  } catch {
    // empty body ok
  }

  // Always wipe stale temp presence rows first.
  await purgeStale(id);

  await prisma.documentPresence.upsert({
    where: {
      documentId_userId: { documentId: id, userId: user.id },
    },
    create: {
      documentId: id,
      userId: user.id,
      cursorFrom,
      cursorTo,
      lastSeenAt: new Date(),
    },
    update: {
      cursorFrom,
      cursorTo,
      lastSeenAt: new Date(),
    },
  });

  const rows = await prisma.documentPresence.findMany({
    where: { documentId: id },
    select: {
      cursorFrom: true,
      cursorTo: true,
      lastSeenAt: true,
      user: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json({
    peers: serializePeers(rows, user.id),
    self: { userId: user.id, name: user.name },
  });
}

/** Leave document — delete this user's temp presence row. */
export async function DELETE(_request: Request, { params }: Params) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await prisma.documentPresence.deleteMany({
    where: { documentId: id, userId: user.id },
  });
  await purgeStale(id);

  return NextResponse.json({ ok: true });
}
