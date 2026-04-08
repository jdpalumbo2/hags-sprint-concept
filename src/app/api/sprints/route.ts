import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { sprints, teams } from "@/db/schema";
import { getSession } from "@/lib/session";
import { generateSprintPlan } from "@/lib/sprint-generator";
import { TEST_TYPES } from "@/lib/test-types";

const testTypeIds = TEST_TYPES.map((t) => t.id);

const createSprintSchema = z.object({
  personCount: z.number().int().min(1).max(6),
  learningQuestion: z.string().min(5).max(500),
  testTypeId: z
    .string()
    .refine((val) => testTypeIds.includes(val as (typeof testTypeIds)[number]), {
      message: "Invalid test type",
    }),
});

export async function POST(req: NextRequest) {
  const teamId = await getSession();
  if (!teamId) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = createSprintSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request.", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { personCount, learningQuestion, testTypeId } = parsed.data;

  const team = await db.query.teams.findFirst({
    where: (t, { eq }) => eq(t.id, teamId),
  });

  if (!team) {
    return NextResponse.json({ error: "Team not found." }, { status: 404 });
  }

  let plan;
  try {
    plan = await generateSprintPlan({
      team,
      personCount,
      learningQuestion,
      testTypeId,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to generate sprint plan.";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const [sprint] = await db
    .insert(sprints)
    .values({
      teamId: team.id,
      personCount,
      learningQuestion,
      testType: testTypeId,
      planJson: plan,
      status: "in_progress",
    })
    .returning({ id: sprints.id });

  return NextResponse.json({ sprintId: sprint.id, plan }, { status: 201 });
}
