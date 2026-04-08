# Phase 2: Sprint Generator

## Goal
A logged-in team can start a 45-minute sprint by answering three questions, and the app generates a time-boxed plan via Claude that the team can view and project on the classroom board. End state: a team clicks "Start a sprint" from /team, fills out the sprint setup form, and lands on a plan page with the 5 time-boxed phases, person assignments, and metrics to track.

## Critical constraints (repeated from CLAUDE.md)
- **NO PII.** Person assignments use "Person 1, Person 2..." with role descriptors like "marketing-leaning" or "ops-leaning". Never names.
- **45 minutes hardcoded.** No time frame picker.
- **5 phases time-boxed.** 0-5, 5-15, 15-30, 30-40, 40-45.
- **Classroom-only tests.** No leaving the room, no bothering other teams in the room, no in-person interviews with strangers. Digital outreach to the team's own contacts, asset creation, A/B tests, form polls, landing page tweaks. The Claude prompt must enforce this.
- **Very early stage.** Most teams have a mockup, a landing page, maybe a basic prototype. Plans must match.
- **Read prompts from disk.** The sprint generator prompt lives at `prompts/sprint-generator.md` and is loaded via `loadPrompt()` from `src/lib/prompts.ts` at request time. Do not inline the prompt as a string in code.
- **No em dashes.**

## Tasks

### 1. Drizzle schema additions
Add to `src/db/schema.ts`:

```typescript
export const sprints = pgTable("sprints", {
  id: uuid("id").primaryKey().defaultRandom(),
  teamId: uuid("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  personCount: integer("person_count").notNull(),
  learningQuestion: text("learning_question").notNull(),
  testType: text("test_type").notNull(),
  planJson: jsonb("plan_json").notNull(),
  status: text("status").notNull().default("in_progress"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Sprint = typeof sprints.$inferSelect;
export type NewSprint = typeof sprints.$inferInsert;
```

Generate and run the migration:
pnpm db:generate
pnpm db:migrate

The `sprint_logs` table comes in Phase 3, do not create it now.

### 2. Test type menu
Create `src/lib/test-types.ts`:

```typescript
export const TEST_TYPES = [
  {
    id: "price",
    label: "Price test",
    description: "Find out what people would actually pay",
  },
  {
    id: "value_prop",
    label: "Value proposition test",
    description: "See which message resonates with customers",
  },
  {
    id: "landing_page",
    label: "Landing page test",
    description: "See if people will sign up or click",
  },
  {
    id: "feature",
    label: "Feature test",
    description: "Find out which feature matters most",
  },
  {
    id: "problem",
    label: "Problem test",
    description: "Confirm this is a real problem worth solving",
  },
  {
    id: "ad",
    label: "Ad test",
    description: "See if people will click on your ad or post",
  },
  {
    id: "preorder",
    label: "Pre-order test",
    description: "See if people will commit before you build",
  },
  {
    id: "demo",
    label: "Demo test",
    description: "See if people understand what you're building",
  },
  {
    id: "ab",
    label: "A/B test",
    description: "Compare two versions to see which wins",
  },
  {
    id: "outreach",
    label: "Outreach test",
    description: "See if people respond to your messages",
  },
  {
    id: "custom",
    label: "Something else",
    description: "Describe your own test idea",
  },
] as const;

export type TestTypeId = typeof TEST_TYPES[number]["id"];
```

### 3. Sprint generator prompt
Write the actual Claude prompt to `prompts/sprint-generator.md`. This is the production prompt the app calls. It needs to:

- Take the team's business context, person count, learning question, and test type as inputs
- Output strict JSON only, no preamble, no markdown fences
- Match this schema exactly:

```typescript
{
  sprintGoal: string,                    // one sentence
  whatWeAreLearning: string,             // restated learning question, sharpened
  phases: [
    {
      timeRange: "0-5 min" | "5-15 min" | "15-30 min" | "30-40 min" | "40-45 min",
      label: string,                     // e.g. "Setup & alignment"
      teamInstructions: string,          // what the whole team does in this phase
      personTasks: [
        {
          personNumber: 1 | 2 | 3 | 4 | 5 | 6,
          roleHint: string,              // e.g. "marketing-leaning", "ops-leaning", "design-leaning"
          task: string,                  // specific actionable task
          steps: string[]                // 2-5 step-by-step instructions
        }
      ]
    }
  ],
  metricsToTrack: string[],              // 3-5 specific things to count or measure
  successCriteria: {
    strong: string,                      // what counts as a clear win
    mixed: string,                       // what counts as inconclusive
    weak: string                         // what counts as a no
  },
  endOfSprintDeliverables: string[],     // 3-5 concrete artifacts the team must produce
  nextStepIfStrong: string,
  nextStepIfWeak: string
}
```

Prompt content requirements:
- Open with the role: "You are a sprint coach for a high school entrepreneurship class."
- State the constraints explicitly: 45 minutes, no leaving the room, no interrupting other teams, digital tools and the team's own contacts only, very early stage businesses
- Tell Claude the team's business context will be injected
- Tell Claude to assign tasks to Person 1, Person 2, etc., based on person count, with role hints, never names
- Tell Claude to scale tasks across the exact number of people (don't generate tasks for 4 people if only 2 are present)
- Tell Claude that every task must be doable from a classroom seat with a phone or laptop
- Tell Claude to bias toward tests that produce numbers (response counts, click counts, preference splits) not vague feelings
- Tell Claude to output ONLY the JSON object, no markdown code fences, no commentary before or after
- Include a brief example of the JSON shape so Claude doesn't drift

Use template variables in the prompt file like `{{businessType}}`, `{{businessDescription}}`, `{{targetCustomer}}`, `{{currentStage}}`, `{{availableTools}}`, `{{personCount}}`, `{{learningQuestion}}`, `{{testTypeLabel}}`, `{{testTypeDescription}}`. The code will substitute these before sending to Claude.

### 4. Prompt loader template substitution
Update `src/lib/prompts.ts`:
- Add a helper `renderPrompt(template: string, vars: Record<string, string | number>): string` that replaces `{{key}}` with the value
- Keep the existing `loadPrompt(name)` and disk caching
- The cache invalidation via `?fresh=1` query param from Phase 0 still works, useful for prompt iteration without restart

### 5. Sprint generator service
Create `src/lib/sprint-generator.ts`:

```typescript
import { z } from "zod";

const PersonTaskSchema = z.object({
  personNumber: z.number().int().min(1).max(6),
  roleHint: z.string(),
  task: z.string(),
  steps: z.array(z.string()).min(2).max(5),
});

const PhaseSchema = z.object({
  timeRange: z.enum(["0-5 min", "5-15 min", "15-30 min", "30-40 min", "40-45 min"]),
  label: z.string(),
  teamInstructions: z.string(),
  personTasks: z.array(PersonTaskSchema),
});

export const SprintPlanSchema = z.object({
  sprintGoal: z.string(),
  whatWeAreLearning: z.string(),
  phases: z.array(PhaseSchema).length(5),
  metricsToTrack: z.array(z.string()).min(3).max(5),
  successCriteria: z.object({
    strong: z.string(),
    mixed: z.string(),
    weak: z.string(),
  }),
  endOfSprintDeliverables: z.array(z.string()).min(3).max(5),
  nextStepIfStrong: z.string(),
  nextStepIfWeak: z.string(),
});

export type SprintPlan = z.infer<typeof SprintPlanSchema>;

export async function generateSprintPlan(input: {
  team: Team;  // import from schema
  personCount: number;
  learningQuestion: string;
  testTypeId: string;
}): Promise<SprintPlan> {
  // 1. Load prompts/sprint-generator.md
  // 2. Render with template vars from team + input
  // 3. Call Claude Sonnet 4.6 via the anthropic client
  //    - max_tokens: 4096
  //    - system: the rendered prompt
  //    - user message: "Generate the sprint plan now."
  // 4. Parse response.content[0].text as JSON
  // 5. Strip any accidental markdown fences (```json ... ```) defensively
  // 6. Validate with SprintPlanSchema, throw on failure
  // 7. Return the parsed plan
}
```

If JSON parsing fails, log the raw response and throw a clear error. Phase 2 does not need retry logic, that's a polish phase concern.

### 6. API route
Create `src/app/api/sprints/route.ts`:

**POST**
- Requires session, 401 if missing
- Body: `{ personCount: number, learningQuestion: string, testTypeId: string }`
- Validate with Zod (personCount 1-6, learningQuestion 5-500 chars, testTypeId from TEST_TYPES)
- Load the team from the session
- Call `generateSprintPlan`
- Insert into `sprints` table with `status: "in_progress"`
- Return `{ sprintId, plan }`

This is a slow endpoint (Claude call takes 5-15 seconds). No streaming for V1 per CLAUDE.md, but make sure the loading state on the client side is clear.

### 7. UI: Start a sprint

**Update `src/app/team/page.tsx`**
- Add a primary button: "Start a sprint" linking to `/sprint/new`

**Create `src/app/sprint/new/page.tsx`**
- Server component, requires session
- Renders a client form with three fields:
  1. **How many people are working today?** (number input or button group 1-6)
  2. **What do you want to learn today?** (textarea, placeholder: "Be specific. Example: Will high schoolers actually pay $15 for this?")
  3. **Pick a test type** (radio cards from TEST_TYPES, each showing label + description)
- "Generate sprint plan" submit button
- On submit: POST to `/api/sprints`, show loading state ("Building your plan..."), on success redirect to `/sprint/[id]`
- Loading state should make it clear this takes 10-15 seconds. Disable the button. Show a spinner with copy like "Designing your test. Hang tight."

**Create `src/app/sprint/[id]/page.tsx`**
- Server component, requires session
- Loads the sprint by id, confirms it belongs to the logged-in team (404 if not)
- Renders the plan structured:
  - Header: sprint goal + what we are learning
  - 5 phase cards in order, each showing:
    - Time range as a big label
    - Phase label
    - Team instructions
    - Person tasks listed as "Person 1 (marketing-leaning): [task]" with steps as a sub-list
  - Metrics to track section
  - Success criteria (strong / mixed / weak)
  - End of sprint deliverables
  - Next steps (strong vs weak)
- "Open board view" button linking to `/sprint/[id]/board`

**Create `src/app/sprint/[id]/board/page.tsx`**
- Same content as the plan page but styled for projector display:
  - Larger fonts (text-2xl minimum, text-4xl for time ranges)
  - High contrast
  - One phase at a time with prev/next buttons OR all phases stacked, your call, pick what's more useful for a classroom
  - Hide nav and team header, just the plan
- This is what gets put on the classroom board so Hags can walk around and see what each team is doing

### 8. Empty states and errors
- If the Claude call fails or JSON validation fails, show a clear error on the sprint setup page: "Something went wrong building your plan. Try again or rephrase your learning question." Do not show a stack trace.
- If the team has no sprints yet, the /team page should still show the "Start a sprint" button as the primary action.

## Stop & Report

When all 8 tasks are complete, stop and report:
1. Confirmation that the sprints migration ran against Railway Postgres
2. A walkthrough of generating a real sprint plan end to end with realistic inputs:
   - Use the HoldMate test team (or create one)
   - Person count: 3
   - Learning question: "Will high schoolers actually pay $15 for a magnetic retainer case?"
   - Test type: Price test
3. Paste the generated JSON plan in the report so JP and Hags can review the quality
4. Screenshot of the /sprint/[id] page rendering the plan
5. Screenshot of the /sprint/[id]/board view
6. List of files created or modified
7. Any deviations from the spec and why
8. Push to GitHub and confirm Vercel deploy succeeds with the new schema

Do NOT start Phase 3. Wait for JP to:
- Test on the live URL with at least 2 different business types and 2 different test types
- Send the generated plans to Hags for quality review
- Iterate on prompts/sprint-generator.md if Hags wants tweaks (this is the whole point of read-from-disk)
- Give the green light

## Out of scope for Phase 2
- The live sprint log (Phase 3)
- Auto-grading (Phase 4)
- Returning team recap with prior sprint context (Phase 5)
- Streaming Claude responses
- Sprint length other than 45 minutes
- Editing or deleting sprints