# AI workflow note

## How AI was used

Cursor (Composer) was used as a pair-programmer for this assignment:

1. **Scoping** — Turned the open-ended brief into a TipTap + Neon full-stack slice with clear cuts
2. **Scaffolding** — Next.js App Router, Prisma schema/migrations, HMAC session auth, API routes
3. **Editor chrome** — Fixed-width paper canvas, Docs-like toolbar, link dialog, context menu, shortcuts
4. **Upload paths** — GFM markdown/txt import + binary attachments
5. **Collaboration lite** — Presence polling, remote cursors/selections (not CRDT)
6. **Export** — TipTap → HTML (images inlined) → Browserless `/pdf`
7. **Tests & docs** — Vitest for import/session helpers; README / architecture / submission packaging

## What stayed human-owned

- Product cuts under a time limit: TipTap over OOXML; seeded Alice/Bob auth; **polling presence** instead of websockets/CRDT; Browserless PDF instead of a custom print pipeline
- Secrets: Neon URL, `SESSION_SECRET`, `BROWSERLESS_API_KEY` in env only (not committed)
- Verification: `npm test`, `npm run build`, migrate/seed on Neon, manual share + presence + export checks
- Reviewer-facing honesty about what was deprioritized and why

## Time-boxed decisions (why this shape shipped)

| Decision | Why (time-limited) |
| --- | --- |
| TipTap JSON in Postgres | Rich text + reopen without inventing a doc format |
| Seeded cookie auth | Demo sharing in minutes; no OAuth setup for reviewers |
| **HTTP polling (~10s) for “who’s editing”** | Easiest collaborative signal that works on serverless Vercel—no socket server, Redis, or CRDT. Good enough to show peer name + cursor/selection |
| Attachments as `BYTEA` | One database, zero S3 config |
| Browserless for PDF | Chrome print fidelity (tables/images) without hosting Puppeteer |
| Inline images as data URIs before PDF | GitHub/CDN assets often fail inside Browserless; server-side fetch + embed is reliable |

## Standards that were not sacrificed

- Access checks on every document mutation (not only UI gating)
- Explicit file-type messaging in UI and README
- Automated tests for import → TipTap JSON and session sign/verify
- Architecture and AI notes written for evaluators, not as afterthoughts

## Prompting pattern that worked

- Lock stack and scope first (Next.js-only, TipTap, Neon, import + attachments)
- Implement vertically: schema → auth → CRUD → editor → share → upload → presence → PDF → deploy
- Prefer “good enough + documented tradeoff” over unfinished “ideal” realtime infrastructure

AI accelerated boilerplate and wiring; engineering judgment drove what shipped and what was cut.
