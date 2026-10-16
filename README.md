# Wordcraft Docs

A scoped full-stack document product: create and edit rich-text documents, import `.txt`/`.md`, attach files, and share with seeded users. Built with **Next.js** (App Router) and **Neon Postgres**.

UI/UX cues were taken from the Casual Docs reference under `docs/` (left out of the app build). The editor itself is **TipTap**, not the full Casual Docs / OOXML engine.

## Live demo

- **Live URL:** https://wordcraft-docs.vercel.app

## Seeded reviewer accounts

| Email | Password | Role in demos |
| --- | --- | --- |
| `alice@example.com` | `password123` | Document owner |
| `bob@example.com` | `password123` | Share recipient |

## Supported file types

| Feature | Types | Limits |
| --- | --- | --- |
| **Import → new document** | `.txt`, `.md` | Max 1 MB |
| **Attachments** | `.pdf`, `.png`, `.jpg`, `.txt`, `.md` | Max 2 MB each |

These limits are also shown in the UI.

## Local setup

Prerequisites: Node.js 20+, npm, and a Postgres database (Neon works).

```bash
cp .env.example .env.local
# Set DATABASE_URL and SESSION_SECRET in .env.local
# Also copy the same DATABASE_URL into .env for Prisma CLI, or rely on prisma.config.ts + dotenv

npm install
npx prisma migrate deploy
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Useful scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Local Next.js server |
| `npm run build` | Production build |
| `npm test` | Vitest (import conversion) |
| `npm run db:seed` | Upsert Alice/Bob + welcome doc |
| `npm run db:migrate` | Apply Prisma migrations |

## What works end to end

- Login with seeded accounts
- Create / rename / edit / autosave / reopen documents
- Rich text: bold, italic, underline, headings, bullet & numbered lists
- Import `.txt` / `.md` into a new editable document
- Attach files to a document and download them
- Share with another user as **viewer** or **editor**
- Home lists: **Owned by you** vs **Shared with you**

## Intentionally incomplete / next 2–4 hours

- Real-time co-editing, comments, version history
- `.docx` import/export
- Signup / OAuth (seeded auth only)
- Stronger markdown fidelity and mobile polish

With more time: add viewer vs editor UI badges on the editor chrome, soft-delete, and attachment previews.

## Architecture & AI notes

- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [AI_WORKFLOW.md](./AI_WORKFLOW.md)
- [SUBMISSION.md](./SUBMISSION.md)
- Walkthrough URL: [WALKTHROUGH_URL.txt](./WALKTHROUGH_URL.txt)
