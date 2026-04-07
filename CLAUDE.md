# Hags Sprint Concept

A classroom tool for high school incubator students to run focused 45-minute MVP test sprints. Students sign in as a team, set their business context once, and use the app daily to design a test, execute it, log results in real time, and submit for grading.

Built for Hags (Uncharted Learning incubator teacher) for in-class "pop-up sprint" days.

## Core Constraints (Non-Negotiable)

1. **No PII storage.** Students are minors. Never store names, emails, photos, or any personally identifiable information about team members. When the app needs to assign work, it uses "Person 1, Person 2, Person 3..." with role descriptors like "marketing-leaning" or "ops-leaning". Never ask for names. If a student types a name into a free-text field, do not persist it in any structured way.

2. **Classroom-only tests.** Every sprint plan generated must be executable inside a single classroom in 45 minutes without:
   - Leaving the room
   - Bothering other student teams
   - Requiring physical materials beyond what's already in the room
   - Talking to strangers in person
   
   Tests are digital outreach, asset creation, A/B comparison, message testing, landing page tweaks, form-based polls sent to the team's own contacts, etc.

3. **Very early stage.** These teams are building websites, mockups, and basic prototypes. Sprint plans must match that maturity. Do not generate plans that assume a finished product, paying customers, or production infra.

4. **45 minutes, hardcoded.** V1 only supports a 45-minute sprint length. Time frame picker comes later.

5. **Time-boxed in 5 phases.** Every sprint plan breaks into:
   - 0-5 min: Setup & alignment
   - 5-15 min: Build test asset
   - 15-30 min: Execute test
   - 30-40 min: Collect & organize data
   - 40-45 min: Insight & decision
   
   This structure goes on the classroom board, so the UI must display it clearly.

## Tech Stack

- **Framework:** Next.js 15 (App Router) + TypeScript
- **Database:** PostgreSQL on Railway, accessed via Drizzle ORM
- **AI:** Anthropic SDK, model `claude-sonnet-4-6`
- **Hosting:** Vercel (frontend) + Railway (Postgres). Both wired up from day one, no local-only phase.
- **Auth:** Team dropdown + passcode (no individual user accounts, no PII)
- **Styling:** Tailwind + shadcn/ui for clean classroom-friendly UI
- **No streaming for V1.** Wait for the full Claude response and render it. Add streaming later if it matters.

## Project Conventions

- **Phase-based builds with stop-and-report gates.** Each phase has a spec file in `/prompts/`. Build one phase, stop, report what was done, wait for go-ahead before starting the next phase. Do not chain phases without a checkpoint.
- **Spec files drive architecture.** Before writing code for a phase, write or update the markdown spec in `/prompts/phase-N-{name}.md`. Code follows spec, not the other way around.
- **No em dashes anywhere.** In code comments, in UI copy, in commit messages, in docs. Hags treats them as an AI tell and so does the project owner.
- **Concise UI copy.** No consultant-speak. No "Let's get started on your journey!" Talk to students like a coach, not a chatbot.
- **Environment variables:** All secrets in `.env.local` (gitignored). Production secrets set in Railway and Vercel dashboards. Never commit keys.

## Data Model (V1)
teams
id (uuid, pk)
team_name (text, unique)
passcode_hash (text)
business_type (enum: product, service, app, website, marketplace, other)
business_description (text, 2-3 sentences)
target_customer (text)
current_stage (enum: idea, mockup, prototype, landing_page_live, has_signups, other)
available_tools (text[])  -- e.g. ["landing page", "instagram", "tiktok", "google form"]
created_at, updated_at
sprints
id (uuid, pk)
team_id (fk -> teams)
person_count (int, 1-6)
learning_question (text)  -- "What do you want to learn today?"
test_type (text)  -- from menu or "custom"
plan_json (jsonb)  -- the full structured plan from Claude
status (enum: in_progress, submitted)
created_at
sprint_logs
id (uuid, pk)
sprint_id (fk -> sprints, unique)
design_notes (text)
execution_notes (text)
data_notes (text)
key_insight (text)
did_it_answer_question (enum: yes, partially, no, unsure)
ai_grade_json (jsonb)  -- light AI auto-grade
submitted_at (timestamp)

## API Surface (V1)

- `POST /api/teams` - create team
- `POST /api/auth/login` - team_name + passcode, returns session cookie
- `GET /api/teams/me` - current team context
- `PATCH /api/teams/me` - update business context (for pivots)
- `GET /api/sprints/last` - return most recent submitted sprint for the logged-in team
- `POST /api/sprints` - create new sprint, calls Claude, returns plan
- `PATCH /api/sprints/:id/log` - update log fields in-progress
- `POST /api/sprints/:id/submit` - finalize, run AI grade, mark submitted

## Claude API Usage

One main prompt: the sprint plan generator. Lives in `/prompts/sprint-generator.md` as the source of truth. Code reads it at request time so Hags or JP can iterate on the prompt without redeploying.

Inputs to the prompt:
- Business context (type, description, target customer, stage, available tools)
- Person count for today
- Learning question
- Selected test type (or "custom")
- Last sprint summary if one exists (so plans build on prior learning)

Output structure: strict JSON with the 5 time-boxed phases, per-person task assignments (Person 1/2/3...), and a list of metrics to track. No prose blob, structured fields the UI can render.

Second prompt: the auto-grade pass. Lives in `/prompts/auto-grade.md`. Lightweight, runs on submit, scores three categories (test design, execution, data & learning) on the mastery scale. Output is JSON, not free-text.

## What V1 Does NOT Include

- Teacher admin dashboard (Phase 2 of the project, post-demo)
- Multi-class or multi-teacher support
- Streaming responses
- Time frame customization (locked to 45 min)
- Editing submitted logs
- Export to Google Sheets
- Email notifications
- Mobile-optimized layout (desktop-first for classroom Chromebooks)