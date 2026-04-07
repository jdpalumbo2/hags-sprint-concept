# Phase 0: Infrastructure & Repo Setup

## Goal
Stand up a deployable Next.js app connected to Railway Postgres and the Anthropic API. End state: a live Vercel URL with a smoke-test endpoint that proves the DB connection and the Claude API call both work.

## Stack
- Next.js 15 (App Router) + TypeScript, src directory, Tailwind
- Drizzle ORM + node-postgres
- Anthropic SDK (`@anthropic-ai/sdk`)
- shadcn/ui (initialize but no components needed yet)
- Railway Postgres (provisioned manually by JP, connection string goes in env)
- Vercel hosting (linked manually by JP)

## Tasks

### 1. Initialize Next.js
- Run `npx create-next-app@latest .` in the repo root
- Options: TypeScript yes, ESLint yes, Tailwind yes, src directory yes, App Router yes, Turbopack yes, import alias `@/*`
- Verify dev server runs

### 2. Install dependencies
pnpm add @anthropic-ai/sdk drizzle-orm pg dotenv
pnpm add -D drizzle-kit @types/pg
(use pnpm; if not installed, use npm and note it in the report)

### 3. shadcn/ui init
- Run `npx shadcn@latest init`
- Defaults are fine. Do not install any components yet.

### 4. Drizzle setup
- Create `drizzle.config.ts` at repo root
- Create `src/db/schema.ts` (empty exports for now, real tables come in Phase 1)
- Create `src/db/index.ts` that exports a configured Drizzle client using `DATABASE_URL`
- Add scripts to `package.json`:
  - `"db:generate": "drizzle-kit generate"`
  - `"db:migrate": "drizzle-kit migrate"`
  - `"db:studio": "drizzle-kit studio"`

### 5. Anthropic client
- Create `src/lib/anthropic.ts` that exports a singleton Anthropic client reading `ANTHROPIC_API_KEY` from env
- Model constant: `export const CLAUDE_MODEL = "claude-sonnet-4-6"`

### 6. Prompt loader
- Create `src/lib/prompts.ts` with a function `loadPrompt(name: string): Promise<string>`
- It reads from `prompts/{name}.md` at the repo root using Node `fs/promises`
- This is the read-from-disk pattern for V1, do not bundle prompts as strings
- Add a simple in-memory cache keyed by filename, but allow `?fresh=1` query param to bust it on the smoke test for iteration

### 7. Environment files
- Create `.env.example` at the repo root with these keys (no values):
DATABASE_URL=
ANTHROPIC_API_KEY=
NODE_ENV=development
- Create `.env.local` at the repo root with the same keys, leave values blank, so JP can fill them in
- Confirm `.env.local` is in `.gitignore` (Next.js gitignores it by default, verify)
- Add a comment at the top of `.env.example`: `# Copy this to .env.local and fill in values. Never commit .env.local.`

### 8. Smoke test endpoint
- Create `src/app/api/smoke/route.ts` with a GET handler that:
  1. Connects to Postgres via the Drizzle client and runs `SELECT 1` (return result)
  2. Calls the Anthropic API with a tiny prompt like "Reply with the single word: ok" using Sonnet 4.6, max_tokens 10
  3. Returns JSON: `{ db: "ok" | error, anthropic: "ok" | error, model: CLAUDE_MODEL, timestamp }`
- This endpoint is throwaway, will be deleted in Phase 1

### 9. Landing page
- Replace the default Next.js landing page at `src/app/page.tsx` with a minimal placeholder:
  - Title: "Sprint"
  - Subtitle: "Classroom MVP test sprints. Coming soon."
  - Small link to `/api/smoke`
- Tailwind only, no shadcn components

### 10. README
- Create `README.md` at repo root with:
  - Project name and one-sentence description
  - Stack list
  - Local dev instructions: copy `.env.example` to `.env.local`, fill in values, `pnpm install`, `pnpm dev`
  - Deploy notes: Vercel auto-deploys from main, Railway hosts Postgres
  - Link to `CLAUDE.md` and `GAMEPLAN.md` (these will be added to repo root by JP)

## Stop & Report

When all 10 tasks are complete, stop and report back with:
1. Confirmation that `pnpm dev` runs locally without errors
2. Output of hitting `http://localhost:3000/api/smoke` (paste the JSON)
3. List of files created
4. Anything you had to deviate from in this spec and why

Do NOT proceed to Phase 1. Wait for JP to:
- Add real values to `.env.local`
- Push to GitHub
- Confirm Vercel deploy succeeds
- Confirm the live `/api/smoke` URL returns ok for both db and anthropic

Then JP will give the green light for Phase 1.

## Out of scope for Phase 0
- Any UI beyond the placeholder landing page
- Any real database tables (Phase 1)
- Authentication (Phase 1)
- The actual sprint generator prompt (Phase 2)
- shadcn components (added as needed in later phases)