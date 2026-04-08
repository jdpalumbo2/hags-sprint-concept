import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SprintForm } from "./sprint-form";

export default async function NewSprintPage() {
  const teamId = await getSession();
  if (!teamId) redirect("/login");

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-2xl mx-auto flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold">New sprint</h1>
          <p className="text-sm text-muted-foreground mt-1">
            45 minutes. Answer three questions to get your plan.
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Set up your sprint</CardTitle>
          </CardHeader>
          <CardContent>
            <SprintForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
