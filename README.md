# hags-sprint-concept

A classroom tool for high school incubator students to run focused 45-minute MVP test sprints.

## Stack

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS + shadcn/ui
- Drizzle ORM + PostgreSQL (Railway)
- Anthropic SDK (claude-sonnet-4-6)
- Hosted on Vercel

## Local dev

```bash
cp .env.example .env.local
# fill in DATABASE_URL and ANTHROPIC_API_KEY in .env.local
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). Hit [http://localhost:3000/api/smoke](http://localhost:3000/api/smoke) to verify DB and Anthropic connections.

## Deploy

- Vercel auto-deploys from `main`. Set `DATABASE_URL` and `ANTHROPIC_API_KEY` in the Vercel project environment variables.
- Railway hosts Postgres. Connection string goes in `DATABASE_URL`.

## Docs

- [CLAUDE.md](./CLAUDE.md) - project constraints, data model, API surface
- [GAMEPLAN.md](./GAMEPLAN.md) - phase-by-phase build plan
