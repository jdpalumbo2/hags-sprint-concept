import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { verifyPasscode } from "@/lib/passcode";
import { createSession } from "@/lib/session";

const loginSchema = z.object({
  teamName: z.string().min(1),
  passcode: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Team name or passcode incorrect." },
        { status: 401 }
      );
    }

    const { teamName, passcode } = parsed.data;
    const team = await db.query.teams.findFirst({
      where: (t, { eq }) => eq(t.teamName, teamName),
    });

    if (!team) {
      return NextResponse.json(
        { error: "Team name or passcode incorrect." },
        { status: 401 }
      );
    }

    const valid = await verifyPasscode(passcode, team.passcodeHash);
    if (!valid) {
      return NextResponse.json(
        { error: "Team name or passcode incorrect." },
        { status: 401 }
      );
    }

    await createSession(team.id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
