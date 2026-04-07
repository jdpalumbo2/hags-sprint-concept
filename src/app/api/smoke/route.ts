import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";
import { anthropic, CLAUDE_MODEL } from "@/lib/anthropic";

export async function GET(req: NextRequest) {
  const fresh = req.nextUrl.searchParams.get("fresh") === "1";
  void fresh; // reserved for prompt cache busting in later endpoints

  // 1. Database check
  let dbResult: string;
  try {
    await db.execute(sql`SELECT 1`);
    dbResult = "ok";
  } catch (err) {
    dbResult = err instanceof Error ? err.message : String(err);
  }

  // 2. Anthropic check
  let anthropicResult: string;
  try {
    const message = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 10,
      messages: [{ role: "user", content: "Reply with the single word: ok" }],
    });
    const text =
      message.content[0].type === "text" ? message.content[0].text.trim() : "";
    anthropicResult = text.toLowerCase().includes("ok") ? "ok" : text;
  } catch (err) {
    anthropicResult = err instanceof Error ? err.message : String(err);
  }

  return NextResponse.json({
    db: dbResult,
    anthropic: anthropicResult,
    model: CLAUDE_MODEL,
    timestamp: new Date().toISOString(),
  });
}
