# Wordcraft Docs

A scoped full-stack document product: create and edit rich-text documents, organize with folders, import `.txt`/`.md` (GFM), attach files, share with seeded users, see who’s editing (polling presence), and export PDF via Browserless. Built with **Next.js** (App Router), **TipTap**, and **Neon Postgres**.

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
| **Import → new document** | `.txt`, `.md` / `.markdown` | Max 1 MB; GFM (headings, lists, tables, links, images, code) |
| **Attachments** | `.pdf`, `.png`, `.jpg`, `.txt`, `.md` | Max 2 MB each |

These limits are also shown in the UI.

## Local setup

Prerequisites: Node.js 20+, npm, and a Postgres database (Neon works).

```bash
cp .env.example .env.local
# Set DATABASE_URL and SESSION_SECRET
# Optional: BROWSERLESS_API_KEY for Export PDF
# Also copy DATABASE_URL into .env for Prisma CLI, or rely on prisma.config.ts + dotenv

npm install
npx prisma migrate deploy
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | yes | Neon / Postgres |
| `SESSION_SECRET` | yes (≥16 chars) | HMAC session cookies (Edge + API must match) |
| `BROWSERLESS_API_KEY` | for PDF | Browserless `/pdf` token |
| `BROWSERLESS_API_URL` | no | Default `https://production-sfo.browserless.io` |

### Useful scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Local Next.js server |
| `npm run build` | Production build |
| `npm test` | Vitest (import + session helpers) |
| `npm run db:seed` | Upsert Alice/Bob + welcome doc |
| `npm run db:migrate` | Apply Prisma migrations |

## What works end to end

- Login with seeded accounts (session cookie + middleware)
- Folders (per account) + breadcrumb navigation
- Create / rename / edit / autosave / delete / reopen documents
- TipTap rich text: bold, italic, underline, strike, headings, lists, align, links, images, tables, code blocks
- Right-click formatting menu + Docs-style shortcuts (incl. ⌘/Ctrl+Z undo)
- Import `.txt` / `.md` (GFM) into a new editable document
- Attach files to a document and download them
- Share with another user as **viewer** or **editor**
- Home: Finder-style owned grid + **Shared with you**
- **Presence (polling ~10s):** see other open editors’ names; remote caret + text selection overlay
- **Export PDF** (Browserless): print CSS + images inlined as data URIs so GitHub/CDN assets survive

## Intentionally incomplete / next 2–4 hours

- Real-time CRDT co-editing / WebSocket presence (polling was the time-boxed choice)
- `.docx` import/export
- Signup / OAuth (seeded auth only)
- Soft-delete trash, attachment image previews in the sidebar
- Stronger mobile polish

## Why these cuts (short)

Under a time limit, **polling for collaborative status** was chosen because it is the easiest path that still demos multi-user awareness on Vercel serverless—no socket server or CRDT. PDF via Browserless + server-side image inlining beats fighting Puppeteer on the edge. See [ARCHITECTURE.md](./ARCHITECTURE.md) for the full tradeoff table.

## Architecture & AI notes

- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [AI_WORKFLOW.md](./AI_WORKFLOW.md)
- [SUBMISSION.md](./SUBMISSION.md)
- Walkthrough URL: [WALKTHROUGH_URL.txt](./WALKTHROUGH_URL.txt)
