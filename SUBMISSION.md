# Submission checklist

## Google Drive folder contents

Include this repository (source) plus the files below:

| Item | Location / notes |
| --- | --- |
| Source code | This repo root (Next.js app). Exclude `node_modules`, `.env`, `.env.local`, and optional reference clone `docs/` |
| README | [README.md](./README.md) — local setup, accounts, file types, features |
| Architecture note | [ARCHITECTURE.md](./ARCHITECTURE.md) |
| AI workflow note | [AI_WORKFLOW.md](./AI_WORKFLOW.md) |
| This checklist | [SUBMISSION.md](./SUBMISSION.md) |
| Walkthrough video URL | [WALKTHROUGH_URL.txt](./WALKTHROUGH_URL.txt) |
| Live product URL | See below |
| Screenshots / GIF | Optional if setup is smooth; not required when Vercel URL works |

## Live deployment

- **URL:** https://wordcraft-docs.vercel.app
- **Platform:** Vercel (`wordcraft-docs`)
- **Env vars on host:** `DATABASE_URL`, `SESSION_SECRET`, and `BROWSERLESS_API_KEY` (for Export PDF)

## Credentials for reviewers

| Email | Password |
| --- | --- |
| `alice@example.com` | `password123` |
| `bob@example.com` | `password123` |

Suggested path: Alice creates/shares → Bob opens under **Shared with you** → both keep the doc open to see presence chips + remote selection → Export PDF.

## Working

- Auth (seeded HMAC cookie + Edge middleware)
- Folders + document create / rename / edit / autosave / delete / reopen
- TipTap formatting (headings, lists, tables, links, images, code, align, etc.)
- Context menu + keyboard shortcuts (undo, save, link, align, …)
- Import `.txt` / `.md` (GFM → TipTap JSON)
- Attachments upload / download / delete (editors & owners)
- Sharing viewer/editor + Owned vs Shared lists
- **Presence polling (~10s)** + remote cursor/selection overlays
- **PDF export** via Browserless (`html` + `options`; images inlined server-side)
- Neon persistence
- Automated tests (`npm test`)

## Time-boxed choices (for evaluators)

- **Polling for collaborative status** — easiest approach that still shows “who else is editing” and where, without websockets/CRDT on serverless Vercel
- **Last-write-wins autosave** — enough for the assignment demo; not multiplayer merge
- **Browserless PDF** — Chrome print quality without hosting a browser on the app server
- **Seeded Alice/Bob** — zero signup friction for reviewers

## Incomplete / would build next (2–4 hours)

- Record and paste Loom/YouTube into `WALKTHROUGH_URL.txt`
- Soft delete, attachment previews, richer conflict handling
- Optional: true realtime (Yjs / PartyKit) if presence needs to feel instantaneous

## Local run (summary)

```bash
cp .env.example .env.local   # fill DATABASE_URL + SESSION_SECRET (+ BROWSERLESS_API_KEY for PDF)
npm install
npx prisma migrate deploy
npm run db:seed
npm run dev
```
