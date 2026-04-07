import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "./login-form";

async function getTeams() {
  try {
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/teams/list`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.teams ?? [];
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
