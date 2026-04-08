import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/db";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

async function getTeams() {
  try {
    return await db.query.teams.findMany({
      columns: { id: true, teamName: true },
      orderBy: (t, { asc }) => [asc(t.teamName)],
    });
  } catch {
    return [];
  }
}

export default async function LoginPage() {
  const teams = await getTeams();

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Log in</CardTitle>
        </CardHeader>
        <CardContent>
          <LoginForm teams={teams} />
        </CardContent>
      </Card>
    </div>
  );
}
