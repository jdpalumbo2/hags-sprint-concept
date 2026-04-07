import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { db } from "@/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EditForm } from "./edit-form";

export default async function TeamEditPage() {
  const teamId = await getSession();
  if (!teamId) redirect("/login");

  const team = await db.query.teams.findFirst({
    where: (t, { eq }) => eq(t.id, teamId),
    columns: { passcodeHash: false },
  });

  if (!team) redirect("/login");

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-lg mx-auto flex flex-col gap-6">
        <h1 className="text-2xl font-bold">Edit context</h1>
        <Card>
          <CardHeader>
            <CardTitle>{team.teamName}</CardTitle>
          </CardHeader>
          <CardContent>
            <EditForm
              initialData={{
                businessType: team.businessType,
                businessDescription: team.businessDescription,
                targetCustomer: team.targetCustomer,
                currentStage: team.currentStage,
                availableTools: team.availableTools,
              }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
