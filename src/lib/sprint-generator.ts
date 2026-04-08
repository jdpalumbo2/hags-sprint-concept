import { z } from "zod";
import { anthropic, CLAUDE_MODEL } from "@/lib/anthropic";
import { loadPrompt, renderPrompt } from "@/lib/prompts";
import { TEST_TYPES } from "@/lib/test-types";
import type { Team } from "@/db/schema";

// -------------------------
// Zod schema for plan output
// -------------------------

const PersonTaskSchema = z.object({
  personNumber: z.number().int().min(1).max(6),
  roleHint: z.string(),
  task: z.string(),
  steps: z.array(z.string()).min(2).max(5),
});

const PhaseSchema = z.object({
  timeRange: z.enum([
    "0-5 min",
    "5-15 min",
    "15-30 min",
    "30-40 min",
    "40-45 min",
  ]),
  label: z.string(),
  teamInstructions: z.string(),
  personTasks: z.array(PersonTaskSchema),
});

export const SprintPlanSchema = z.object({
  sprintGoal: z.string(),
  whatWeAreLearning: z.string(),
  phases: z.array(PhaseSchema).min(5).max(5),
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

// -------------------------
// Generator
// -------------------------

export async function generateSprintPlan(input: {
  team: Team;
  personCount: number;
  learningQuestion: string;
  testTypeId: string;
}): Promise<SprintPlan> {
  const { team, personCount, learningQuestion, testTypeId } = input;

  const testType = TEST_TYPES.find((t) => t.id === testTypeId);
  const testTypeLabel = testType?.label ?? testTypeId;
  const testTypeDescription = testType?.description ?? "";

  const template = await loadPrompt("sprint-generator");

  const rendered = renderPrompt(template, {
    businessType: team.businessType,
    businessDescription: team.businessDescription,
    targetCustomer: team.targetCustomer,
    currentStage: team.currentStage,
    availableTools:
      team.availableTools.length > 0
        ? team.availableTools.join(", ")
        : "no specific tools listed (use general phone/laptop capabilities)",
    personCount,
    learningQuestion,
    testTypeLabel,
    testTypeDescription,
  });

  const message = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 8192,
    system: rendered,
    messages: [{ role: "user", content: "Generate the sprint plan now." }],
  });

  const raw =
    message.content[0].type === "text" ? message.content[0].text : "";

  // Strip accidental markdown fences defensively
  const cleaned = raw
    .replace(/^```(?:json)?\s*/m, "")
    .replace(/\s*```\s*$/m, "")
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    console.error("[sprint-generator] JSON parse failed. Raw response:", raw);
    throw new Error(
      "Claude returned an unexpected response format. Try rephrasing your learning question."
    );
  }

  const result = SprintPlanSchema.safeParse(parsed);
  if (!result.success) {
    console.error(
      "[sprint-generator] Schema validation failed:",
      result.error.flatten()
    );
    console.error("[sprint-generator] Raw parsed JSON:", JSON.stringify(parsed, null, 2));
    throw new Error(
      "The generated plan did not match the expected format. Try again."
    );
  }

  return result.data;
}
