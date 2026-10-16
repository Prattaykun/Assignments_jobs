import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { EMPTY_DOCUMENT } from "../lib/empty-document";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);

  const alice = await prisma.user.upsert({
    where: { email: "alice@example.com" },
    update: { name: "Alice", passwordHash },
    create: {
      email: "alice@example.com",
      name: "Alice",
      passwordHash,
    },
  });

  const bob = await prisma.user.upsert({
    where: { email: "bob@example.com" },
    update: { name: "Bob", passwordHash },
    create: {
      email: "bob@example.com",
      name: "Bob",
      passwordHash,
    },
  });

  const projects = await prisma.folder.upsert({
    where: { id: "seed-alice-projects" },
    update: { name: "Projects", ownerId: alice.id, parentId: null },
    create: {
      id: "seed-alice-projects",
      name: "Projects",
      ownerId: alice.id,
      parentId: null,
    },
  });

  const existing = await prisma.document.findFirst({
    where: { ownerId: alice.id, title: "Welcome to Docs" },
  });

  if (!existing) {
    await prisma.document.create({
      data: {
        title: "Welcome to Docs",
        ownerId: alice.id,
        folderId: projects.id,
        contentJson: {
          type: "doc",
          content: [
            {
              type: "heading",
              attrs: { level: 1 },
              content: [{ type: "text", text: "Welcome" }],
            },
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Create, edit, import, attach files, and share documents with Bob.",
                },
              ],
            },
            {
              type: "bulletList",
              content: [
                {
                  type: "listItem",
                  content: [
                    {
                      type: "paragraph",
                      content: [{ type: "text", text: "Bold, italic, underline" }],
                    },
                  ],
                },
                {
                  type: "listItem",
                  content: [
                    {
                      type: "paragraph",
                      content: [{ type: "text", text: "Headings and lists" }],
                    },
                  ],
                },
              ],
            },
          ],
        },
      },
    });
  }

  console.log("Seeded users:");
  console.log(`  ${alice.email} / password123`);
  console.log(`  ${bob.email} / password123`);
  void EMPTY_DOCUMENT;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
