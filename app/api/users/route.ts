import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const users = await prisma.user.findMany({
    where: { NOT: { id: user.id } },
    select: { id: true, email: true, name: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ users });
}
