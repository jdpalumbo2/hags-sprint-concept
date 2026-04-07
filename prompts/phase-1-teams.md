# Phase 1: Team Auth & Business Context

## Goal
Teams can sign up, log in with a passcode, and store/edit their business context. No PII anywhere. End state: a logged-in team can view and edit their business context on a `/team` page.

## Critical constraints (from CLAUDE.md, repeated here)
- **NO PII.** Never collect names, emails, photos, ages, schools, or anything identifying about individual students. Team name is the only identifier. If you find yourself adding a "name" field to anything, stop.
- **Team name is the login.** Combined with a passcode. That is the entire auth model.
- **Very early stage businesses.** Copy and field options should reflect that students are building mockups, landing pages, and basic prototypes. Not production businesses.
- **No em dashes** in any UI copy, code comments, or commit messages.

## Tasks

### 1. Delete the smoke test
- Remove `src/app/api/smoke/route.ts`
- Phase 0 is over, the endpoint is no longer needed

### 2. Drizzle schema for teams
In `src/db/schema.ts`, define the `teams` table:
```typescript
import { pgTable, uuid, text, timestamp, pgEnum } from "drizzle-orm/pg-core";

export const businessTypeEnum = pgEnum("business_type", [
  "product",
  "service",
  "app",
  "website",
  "marketplace",
  "other",
]);

export const currentStageEnum = pgEnum("current_stage", [
  "idea",
  "mockup",
  "prototype",
  "landing_page_live",
  "has_signups",
  "other",
]);

export const teams = pgTable("teams", {
  id: uuid("id").primaryKey().defaultRandom(),
  teamName: text("team_name").notNull().unique(),
  passcodeHash: text("passcode_hash").notNull(),
  businessType: businessTypeEnum("business_type").notNull(),
  businessDescription: text("business_description").notNull(),
  targetCustomer: text("target_customer").notNull(),
  currentStage: currentStageEnum("current_stage").notNull(),
  availableTools: text("available_tools").array().notNull().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Team = typeof teams.$inferSelect;
export type NewTeam = typeof teams.$inferInsert;
```

Generate and run the migration:
pnpm db:generate
pnpm db:migrate

### 3. Passcode hashing
- Install `bcryptjs` and `@types/bcryptjs`
- Create `src/lib/passcode.ts` with `hashPasscode(plain: string)` and `verifyPasscode(plain: string, hash: string)` functions
- Use 10 salt rounds

### 4. Session cookies
- Create `src/lib/session.ts`
- Use Next.js `cookies()` from `next/headers`
- Cookie name: `sprint_session`
- Value: signed team ID (use a simple HMAC with a `SESSION_SECRET` env var)
- Add `SESSION_SECRET` to `.env.example` and `.env.local` (leave .env.local value blank for JP to fill, generate one with `openssl rand -hex 32`)
- Functions:
  - `createSession(teamId: string)` - sets the cookie
  - `getSession()` - reads cookie, returns teamId or null
  - `destroySession()` - clears cookie
- httpOnly, secure in production, sameSite lax, 30 day expiry

### 5. Available tools list
- Create `src/lib/tools.ts` exporting a constant array of tools students might have. Keep this list grounded in what early-stage high school teams actually have:
```typescript
export const AVAILABLE_TOOLS = [
  "Landing page",
  "Instagram account",
  "TikTok account",
  "Google Form",
  "Canva",
  "Mockup or wireframe",
  "Working prototype",
  "Email list",
  "Phone contacts to message",
  "School DM/text group",
] as const;

export type AvailableTool = typeof AVAILABLE_TOOLS[number];
```

This is the multi-select source of truth. Do not hardcode the list in components, import it from here.

### 6. API routes

Create the following route handlers. All return JSON.

**`src/app/api/teams/route.ts` - POST (create team)**
- Body: `{ teamName, passcode, businessType, businessDescription, targetCustomer, currentStage, availableTools }`
- Validate with Zod
- Check team name uniqueness, return 409 if taken
- Hash passcode, insert team, create session, return `{ ok: true, teamId }`

**`src/app/api/teams/list/route.ts` - GET**
- Returns `{ teams: [{ id, teamName }] }` for the dropdown
- Only id and teamName, never any other fields

**`src/app/api/auth/login/route.ts` - POST**
- Body: `{ teamName, passcode }`
- Look up team, verify passcode, create session, return `{ ok: true }`
- 401 on failure with generic "Team name or passcode incorrect"

**`src/app/api/auth/logout/route.ts` - POST**
- Destroy session, return `{ ok: true }`

**`src/app/api/teams/me/route.ts`**
- GET: returns the current team's full context (requires session, 401 if missing)
- PATCH: updates business context fields, requires session, returns updated team
- Never return `passcodeHash` in any response

### 7. UI pages

Use shadcn components where they fit. Install only what you need:
npx shadcn@latest add input button select textarea label card checkbox

**`src/app/page.tsx` - Landing**
- Replace the placeholder
- Two big buttons: "Log in to your team" and "Create a new team"
- That's it. No marketing copy, no feature list. This is for a classroom.

**`src/app/login/page.tsx`**
- Team name dropdown (fetched from `/api/teams/list`)
- Passcode input
- Submit button
- "Don't see your team? Create one" link to `/signup`
- On success, redirect to `/team`

**`src/app/signup/page.tsx`**
- Form with all the fields:
  - Team name (text)
  - Passcode (text, min 4 chars, with a small note: "Pick something your team will remember. Not a password.")
  - Business type (radio or select: Product / Service / App / Website / Marketplace / Other)
  - Business description (textarea, 2-3 sentences, with placeholder: "What are you building and who is it for?")
  - Target customer (text input, placeholder: "Who would actually use this?")
  - Current stage (select: Just an idea / Mockup or wireframe / Working prototype / Landing page is live / Have signups or interest / Other)
  - Available tools (checkbox group from `AVAILABLE_TOOLS`)
- Submit creates team, logs in, redirects to `/team`

**`src/app/team/page.tsx`**
- Server component, requires session
- Shows the team's stored business context in a clean read view
- "Edit context" button toggles edit mode (or routes to `/team/edit`)
- "Log out" button
- For now, no "Start a sprint" button, that comes in Phase 2

**`src/app/team/edit/page.tsx` (or inline edit, your call)**
- Same fields as signup minus team name and passcode
- Saves via PATCH to `/api/teams/me`
- Redirects back to `/team` on save

### 8. Middleware for protected routes
- Create `src/middleware.ts`
- If a user hits `/team` or `/team/*` without a valid session, redirect to `/login`
- Public routes: `/`, `/login`, `/signup`, all `/api/auth/*` and `/api/teams` POST and `/api/teams/list` GET

### 9. Copy and tone
All UI copy should be:
- Short
- Direct
- Talking to high school students, not enterprise users
- No exclamation marks, no "Welcome aboard!" energy
- No em dashes anywhere

Examples of good copy:
- "Pick your team"
- "What are you building?"
- "Who would actually use this?"
- "Save changes"

Examples of bad copy (do not use):
- "Welcome to your team dashboard!"
- "Let's get started on your entrepreneurial journey"
- "Tell us about your amazing business idea"

## Stop & Report

When all 9 tasks are complete, stop and report:
1. Confirmation that migrations ran successfully against Railway Postgres
2. A walkthrough of the full flow tested locally:
   - Create a test team with realistic high school business data (e.g., "HoldMate" magnetic retainer case)
   - Log out
   - Log back in
   - View the team context page
   - Edit the business context and save
3. Screenshot or copy of the `/team` page after login
4. List of files created or modified
5. Any deviations from the spec and why
6. Push to GitHub and confirm the Vercel deploy succeeds with the new schema

Do NOT start Phase 2. Wait for JP to:
- Test the full flow on the live Vercel URL
- Confirm no PII fields slipped in
- Confirm the copy reads right for a classroom audience
- Give the green light

## Out of scope for Phase 1
- Sprints, sprint plans, sprint logs (Phase 2 and 3)
- The Claude API call for plan generation (Phase 2)
- Auto-grade (Phase 4)
- Returning team recap (Phase 5)
- Teacher admin dashboard (post-V1)
- Pivot version history (post-V1)