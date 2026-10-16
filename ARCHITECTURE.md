# Architecture note

## Product judgment

The assignment asks for a coherent slice of a docs product, not Google Docs. Depth was prioritized in:

1. **Editing + persistence** — TipTap JSON in Postgres so formatting survives refresh
2. **Access logic** — owner / editor / viewer with clear Owned vs Shared lists
3. **Upload paths** — import-to-document and document attachments, with explicit type limits

Deliberately deprioritized: real-time CRDT co-editing, Word/OOXML fidelity, comments, templates gallery, and production identity (OAuth). Those inflate scope without proving the core full-stack loop.

The Casual Docs tree in `docs/` was used as **visual and product reference** (home cards, paper canvas, share intent). Embedding `@casualoffice/docs` was rejected: it is a large Bun/Vite monorepo with a layout painter and collab server, and would dominate a short assignment with packaging risk.

## Stack

| Layer | Choice | Why |
| --- | --- | --- |
| Frontend + API | Next.js 15 App Router | Single deployable bundle as required |
| Editor | TipTap + StarterKit + Underline | Meets rich-text requirements with maintainable JSON |
| DB | Neon Postgres + Prisma | Shared persistence, free-tier friendly |
| Auth | HMAC-signed httpOnly cookie + bcrypt | Enough to demo sharing without paid IdP |
| Attachments | `BYTEA` in Postgres | No extra object-storage bill or config for reviewers |
| Deploy | Vercel | Natural fit for Next.js; free for reviewers |

## Data model

- `User` — seeded accounts
- `Document` — `title`, `contentJson` (TipTap), `ownerId`
- `DocumentShare` — `(documentId, userId)` unique, role `VIEWER` | `EDITOR`
- `Attachment` — metadata + binary `data`

## Access rules

| Access | Read | Edit content / attachments | Manage shares / delete |
| --- | --- | --- | --- |
| Owner | yes | yes | yes |
| Editor | yes | yes | no |
| Viewer | yes | no | no |
| Other | 404/403 | no | no |

Middleware verifies the session cookie on protected routes. Route handlers re-check document access before mutations.

## Request flow (edit)

```
Browser TipTap → PATCH /api/documents/:id (debounced autosave)
  → session user → getDocumentAccess → Prisma update contentJson
```

## Tradeoffs called out

- **No live sync:** last-write-wins autosave is enough for single-user demos
- **Attachments in DB:** simple deploy story; not ideal for large files (hard 2 MB cap)
- **Markdown import:** hand-rolled parser for headings/lists/inline marks — predictable in serverless, not CommonMark-complete
- **Seeded auth only:** reviewers can switch Alice ↔ Bob without signup friction
