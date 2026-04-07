import { NextResponse } from "next/server";
import { db } from "@/db";

export async function GET() {
  try {
    const rows = await db.query.teams.findMany({
      columns: { id: true, teamName: true },
      orderBy: (t, { asc }) => [asc(t.teamName)],
    });
    return NextResponse.json({ teams: rows });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
