import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
// TEMP: kept for re-enable. See commented block below.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { verifyPasscode } from "@/lib/passcode";
import { createSession } from "@/lib/session";

const loginSchema = z.object({
  teamName: z.string().min(1),
  passcode: z.string().optional(),
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

    const { teamName } = parsed.data;
    const team = await db.query.teams.findFirst({
      where: (t, { eq }) => eq(t.teamName, teamName),
    });

    if (!team) {
      return NextResponse.json(
        { error: "Team not found." },
        { status: 401 }
      );
    }

    // TEMP: passcode check disabled for V1 classroom demo. Re-enable before wider rollout.
    // const valid = await verifyPasscode(passcode, team.passcodeHash);
    // if (!valid) {
    //   return NextResponse.json(
    //     { error: "Team name or passcode incorrect." },
    //     { status: 401 }
    //   );
    // }

    await createSession(team.id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
