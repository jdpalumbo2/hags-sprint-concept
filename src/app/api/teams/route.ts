import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { teams } from "@/db/schema";
import { hashPasscode } from "@/lib/passcode";
import { createSession } from "@/lib/session";

const createTeamSchema = z.object({
  teamName: z.string().min(1).max(100),
  passcode: z.string().min(4),
  businessType: z.enum([
    "product",
    "service",
    "app",
    "website",
    "marketplace",
    "other",
  ]),
  businessDescription: z.string().min(1),
  targetCustomer: z.string().min(1),
  currentStage: z.enum([
    "idea",
    "mockup",
    "prototype",
    "landing_page_live",
    "has_signups",
    "other",
  ]),
  availableTools: z.array(z.string()).default([]),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createTeamSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const {
      teamName,
      passcode,
      businessType,
      businessDescription,
      targetCustomer,
      currentStage,
      availableTools,
    } = parsed.data;

    // Check uniqueness
    const existing = await db.query.teams.findFirst({
      where: (t, { eq }) => eq(t.teamName, teamName),
    });
    if (existing) {
      return NextResponse.json(
        { error: "That team name is already taken." },
        { status: 409 }
      );
    }

    const passcodeHash = await hashPasscode(passcode);
    const [team] = await db
      .insert(teams)
      .values({
        teamName,
        passcodeHash,
        businessType,
        businessDescription,
        targetCustomer,
        currentStage,
        availableTools,
      })
      .returning({ id: teams.id });

    await createSession(team.id);
    return NextResponse.json({ ok: true, teamId: team.id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
