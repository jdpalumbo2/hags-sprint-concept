import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { teams } from "@/db/schema";
import { getSession } from "@/lib/session";

export async function GET() {
  const teamId = await getSession();
  if (!teamId) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const team = await db.query.teams.findFirst({
    where: (t, { eq }) => eq(t.id, teamId),
    columns: {
      id: true,
      teamName: true,
      businessType: true,
      businessDescription: true,
      targetCustomer: true,
      currentStage: true,
      availableTools: true,
      createdAt: true,
      updatedAt: true,
      passcodeHash: false,
    },
  });

  if (!team) {
    return NextResponse.json({ error: "Team not found." }, { status: 404 });
  }

  return NextResponse.json({ team });
}

const updateTeamSchema = z.object({
  businessType: z
    .enum(["product", "service", "app", "website", "marketplace", "other"])
    .optional(),
  businessDescription: z.string().min(1).optional(),
  targetCustomer: z.string().min(1).optional(),
  currentStage: z
    .enum([
      "idea",
      "mockup",
      "prototype",
      "landing_page_live",
      "has_signups",
      "other",
    ])
    .optional(),
  availableTools: z.array(z.string()).optional(),
});

export async function PATCH(req: NextRequest) {
  const teamId = await getSession();
  if (!teamId) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = updateTeamSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const updates = { ...parsed.data, updatedAt: new Date() };
    const [updated] = await db
      .update(teams)
      .set(updates)
      .where(eq(teams.id, teamId))
      .returning({
        id: teams.id,
        teamName: teams.teamName,
        businessType: teams.businessType,
        businessDescription: teams.businessDescription,
        targetCustomer: teams.targetCustomer,
        currentStage: teams.currentStage,
        availableTools: teams.availableTools,
        updatedAt: teams.updatedAt,
      });

    if (!updated) {
      return NextResponse.json({ error: "Team not found." }, { status: 404 });
    }

    return NextResponse.json({ team: updated });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
