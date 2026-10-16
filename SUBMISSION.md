# Submission checklist

## Google Drive folder contents

Include this repository (source) plus the files below:

| Item | Location / notes |
| --- | --- |
| Source code | This repo root (Next.js app). Exclude `node_modules`, `.env`, `.env.local`, and optional reference clone `docs/` |
| README | [README.md](./README.md) — local setup, accounts, file types |
| Architecture note | [ARCHITECTURE.md](./ARCHITECTURE.md) |
| AI workflow note | [AI_WORKFLOW.md](./AI_WORKFLOW.md) |
| This checklist | [SUBMISSION.md](./SUBMISSION.md) |
| Walkthrough video URL | [WALKTHROUGH_URL.txt](./WALKTHROUGH_URL.txt) |
| Live product URL | See below |
| Screenshots / GIF | Optional if setup is smooth; not required when Vercel URL works |

## Live deployment

- **URL:** https://wordcraft-docs.vercel.app
- **Platform:** Vercel (`wordcraft-docs`)
- **Env vars required on host:** `DATABASE_URL`, `SESSION_SECRET` (set for the deployment that is live)

## Credentials for reviewers

| Email | Password |
| --- | --- |
| `alice@example.com` | `password123` |
| `bob@example.com` | `password123` |

Suggested path: Alice creates/shares → Bob opens under **Shared with you**.

## Working

- Auth (seeded)
- Document create / rename / edit / autosave / reopen
- TipTap formatting (bold, italic, underline, headings, lists)
- Import `.txt` / `.md`
- Attachments upload / download / delete (editors & owners)
- Sharing viewer/editor + Owned vs Shared lists
- Neon persistence
- Automated import tests (`npm test`)

## Incomplete / would build next (2–4 hours)

- Record and paste Loom/YouTube into `WALKTHROUGH_URL.txt`
- Soft delete, richer markdown, attachment previews
- Optional: viewer watermark / clearer read-only chrome

## Local run (summary)

```bash
cp .env.example .env.local   # fill DATABASE_URL + SESSION_SECRET
npm install
npx prisma migrate deploy
npm run db:seed
npm run dev
```
