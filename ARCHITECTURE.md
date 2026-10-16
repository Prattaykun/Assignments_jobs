# Architecture note

## Product judgment

The assignment asks for a coherent slice of a docs product, not Google Docs. Depth was prioritized in:

1. **Editing + persistence** — TipTap JSON in Postgres so formatting survives refresh
2. **Access logic** — owner / editor / viewer with Owned vs Shared lists
3. **Upload paths** — GFM `.md`/`.txt` import-to-document and per-document attachments
4. **Lightweight collaboration** — presence + remote cursor/selection (polling)
5. **Export** — PDF via Browserless with print CSS and inlined images

Deliberately deprioritized under a time limit: CRDT co-editing, WebSocket infrastructure, Word/OOXML fidelity, comments, templates gallery, and production identity (OAuth). Those inflate scope without proving the core full-stack loop.

## Stack

| Layer | Choice | Why |
| --- | --- | --- |
| Frontend + API | Next.js 15 App Router | Single deployable bundle as required |
| Editor | TipTap (StarterKit, tables, images, links, align, etc.) | Rich text + maintainable JSON; GFM import maps into the same schema |
| DB | Neon Postgres + Prisma | Shared persistence, free-tier friendly |
| Auth | HMAC-signed httpOnly cookie + bcrypt | Enough to demo sharing without paid IdP |
| Presence | `DocumentPresence` rows + ~10s poll | **Easiest collab approach in a time box**—works on serverless; no socket farm |
| Attachments | `BYTEA` in Postgres | No extra object-storage bill or config for reviewers |
| PDF | Browserless `/pdf` + server-side image inlining | Real Chrome print (selectable text); avoids Puppeteer on Vercel |
| Deploy | Vercel | Natural fit for Next.js |

## Data model

- `User` — seeded accounts
- `Folder` — per-account Finder-style nesting
- `Document` — `title`, `contentJson` (TipTap), `ownerId`, optional `folderId`
- `DocumentShare` — `(documentId, userId)` unique, role `VIEWER` | `EDITOR`
- `Attachment` — metadata + binary `data`
- `DocumentPresence` — **ephemeral** “who’s here” + cursor/selection positions; stale rows purged on each heartbeat

## Access rules

| Access | Read | Edit content / attachments | Manage shares / delete |
| --- | --- | --- | --- |
| Owner | yes | yes | yes |
| Editor | yes | yes | no |
| Viewer | yes | no | no |
| Other | 404/403 | no | no |

Middleware verifies the session cookie on protected routes. Route handlers re-check document access before mutations.

## Request flows

### Edit

```
Browser TipTap → PATCH /api/documents/:id (debounced autosave)
  → session user → getDocumentAccess → Prisma update contentJson
```

### Presence (why polling)

```
Editor open → POST /api/documents/:id/presence every ~10s (+ on selection, throttled)
  → purge stale DocumentPresence rows
  → upsert self (cursorFrom / cursorTo)
  → return other peers → title bar chips + remote caret/selection overlays
```

**Why polling instead of websockets/CRDT:** under a time limit it is the simplest path that still demonstrates “someone else has this doc open and where their selection is.” It fits Vercel serverless (stateless POSTs), needs no extra realtime infrastructure, and is honest about last-write-wins content saves.

### PDF export

```
Export PDF → save latest content → build HTML from TipTap JSON
  → fetch remote <img> URLs on the server, embed as data: URIs
  → POST html + options to Browserless /pdf?token=…
  → download application/pdf
```

GitHub/CDN images often fail when Browserless fetches them itself (redirects / hotlink rules). Inlining on our API fixes that without changing the Browserless request shape (`html` + `options` + shared wait helpers).

## Tradeoffs called out

- **No CRDT / live merge:** content is last-write-wins autosave; presence is awareness-only
- **Polling (~10s):** slightly laggy peer cursors vs websockets—accepted for simplicity and deployability
- **Attachments in DB:** simple deploy story; hard 2 MB cap
- **GFM import:** `marked` + TipTap `generateJSON`—stronger than plain text, not a full GitHub renderer
- **Seeded auth only:** reviewers switch Alice ↔ Bob without signup friction
- **Browserless dependency:** PDF needs `BROWSERLESS_API_KEY`; export is best-effort if the key is missing
