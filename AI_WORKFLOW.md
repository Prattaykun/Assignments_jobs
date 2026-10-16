# AI workflow note

## How AI was used

Cursor (Composer) was used as a pair-programmer for this assignment:

1. **Scoping** — Turned the open-ended brief into a TipTap + Neon slice instead of embedding the full Casual Docs editor
2. **Scaffolding** — Generated Next.js App Router structure, Prisma schema, auth/session helpers, and API routes
3. **UI** — Built Casual Docs–inspired home/editor chrome (paper canvas, owned vs shared lists) without copying the reference monorepo
4. **Tests & docs** — Vitest coverage for import conversion; README / architecture / submission packaging

## What stayed human-owned

- Product cuts: TipTap over DocxEditor; both import + attachments; seeded Alice/Bob auth
- Secrets handling: Neon URL kept in `.env` / `.env.local`, not committed
- Verification: `npm test`, `npm run build`, migrate/seed against Neon, manual walkthrough of share flows
- Reviewer-facing honesty about what was deprioritized

## Standards that were not sacrificed

- Access checks on every document mutation (not only UI gating)
- Explicit file-type messaging in UI and README
- One meaningful automated test (import → TipTap JSON)
- Architecture and AI notes written for evaluators, not as afterthoughts

## Prompting pattern that worked

- Lock stack and scope first (Next.js-only, TipTap, Neon, upload = import + attachments)
- Implement vertically: schema → auth → CRUD → editor → share → upload → deploy docs
- Fix build failures from the reference `docs/` tree by excluding it from `tsconfig` / Vitest rather than deleting the reference

AI accelerated boilerplate and wiring; engineering judgment drove what shipped and what was cut.
