# Build Plan

Each phase has a spec file in `/prompts/`. Build → stop → report → wait for approval → next phase.

## Phase 0: Infra & Repo Setup
**Spec:** `/prompts/phase-0-infra.md`

- Initialize Next.js 15 + TS in repo root
- Tailwind + shadcn/ui base setup
- Drizzle + Postgres connection (Railway)
- Anthropic SDK installed and a smoke-test endpoint that hits Sonnet 4.6 and returns "ok"
- Vercel project linked, Railway Postgres provisioned, env vars wired in both
- `.env.example` committed, `.env.local` gitignored
- First deploy to Vercel succeeds with the smoke test endpoint working against Railway DB

**Stop & report:** Live Vercel URL + smoke test confirmation.

## Phase 1: Team Auth & Context
**Spec:** `/prompts/phase-1-teams.md`

- Drizzle migrations for `teams` table
- Login screen: team dropdown (existing teams) + "Create new team" button + passcode field
- Create team flow: name, passcode, full business context form (type, description, target customer, stage, available tools as multi-select)
- Session cookie on login
- "My team context" page where teams can view and edit their stored context (rudimentary pivot support)
- Empty state copy that talks to high school students, not enterprise users

**Stop & report:** Demo a team signup, login, and context edit flow on the live URL.

## Phase 2: Sprint Generator
**Spec:** `/prompts/phase-2-sprint-generator.md`  
**Prompt file:** `/prompts/sprint-generator.md`

- Sprints + sprint_logs migrations
- "Start a sprint" page: person count input (1-6), learning question free-text, test type dropdown populated from the test menu (with "custom" option)
- Server action that calls Claude Sonnet 4.6 with the sprint generator prompt, the team's business context, and today's inputs
- Strict JSON response schema validation (use Zod)
- Plan display page with the 5 time-boxed phases as cards, person assignments shown as Person 1 / Person 2 / etc., metrics list
- "Print to board" view (clean, large text, projector-friendly)

**Stop & report:** Generate a real sprint plan end-to-end on the live URL, screenshot it, send to Hags for sanity check.

## Phase 3: Live Sprint Log
**Spec:** `/prompts/phase-3-live-log.md`

- Log UI splits into three sections matching the workflow: Design, Execution, Data
- Each section unlocks as the team progresses (or all open at once with clear visual sectioning, decide during build)
- Auto-save on blur, no submit button per section
- Final fields: key insight, did it answer your question (yes/partially/no/unsure)
- Submit button only active when minimum fields are filled

**Stop & report:** Walk through a full sprint + log fill on the live URL.

## Phase 4: Auto-Grade & Submission
**Spec:** `/prompts/phase-4-grade.md`  
**Prompt file:** `/prompts/auto-grade.md`

- On submit, server action calls Claude with the auto-grade prompt
- Stores the grade JSON alongside the log
- Confirmation screen that shows the team their grade summary with light feedback
- Submission is locked after submit (no edits)

**Stop & report:** Submit a real sprint, show the auto-grade output, send to Hags to verify the rubric alignment is reasonable.

## Phase 5: Returning Team Recap
**Spec:** `/prompts/phase-5-recap.md`

- On login, if the team has a previous submitted sprint, show a "Last session" card before the sprint builder
- Card shows: learning question, test type, key insight, did it answer the question
- "Start a new sprint" button continues into Phase 2 flow
- The previous sprint summary gets passed into the sprint generator prompt as context, so today's plan can build on it

**Stop & report:** Demo the full returning-team flow.

## Phase 6: Polish & Demo Prep
**Spec:** `/prompts/phase-6-polish.md`

- UI cleanup pass
- Empty states, loading states, error states
- Hardcoded test menu reviewed with Hags
- Sprint generator prompt iterated based on real outputs from Phases 2-5
- README with how to run and how to demo

**Stop & report:** Demo-ready link sent to Hags.

---

## Out of Scope for V1 (track for V2)
- Teacher admin dashboard with all team submissions
- Auto-grade override / manual grade
- Multi-class structure
- Sprint length customization
- Streaming AI responses
- Mobile layout
- Export to CSV / Google Sheets
- Pivots stored as version history