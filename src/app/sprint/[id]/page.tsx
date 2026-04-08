import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { db } from "@/db";
import { SprintPlanSchema, type SprintPlan } from "@/lib/sprint-generator";
import { TEST_TYPES } from "@/lib/test-types";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const TIME_RANGE_COLORS: Record<string, string> = {
  "0-5 min": "bg-slate-100 text-slate-800",
  "5-15 min": "bg-blue-50 text-blue-800",
  "15-30 min": "bg-green-50 text-green-800",
  "30-40 min": "bg-amber-50 text-amber-800",
  "40-45 min": "bg-purple-50 text-purple-800",
};

export default async function SprintPlanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const teamId = await getSession();
  if (!teamId) redirect("/login");

  const sprint = await db.query.sprints.findFirst({
    where: (s, { and, eq }) => and(eq(s.id, id), eq(s.teamId, teamId)),
  });

  if (!sprint) notFound();

  let plan: SprintPlan;
  try {
    plan = SprintPlanSchema.parse(sprint.planJson);
  } catch {
    return (
      <div className="min-h-screen bg-white p-6 flex items-center justify-center">
        <p className="text-destructive">This plan could not be loaded.</p>
      </div>
    );
  }

  const testType = TEST_TYPES.find((t) => t.id === sprint.testType);

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-3xl mx-auto flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <Link
              href="/team"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Back to team
            </Link>
            <h1 className="text-2xl font-bold">{plan.sprintGoal}</h1>
            <p className="text-sm text-muted-foreground">
              {testType?.label ?? sprint.testType} &middot; {sprint.personCount}{" "}
              {sprint.personCount === 1 ? "person" : "people"}
            </p>
          </div>
          <Link
            href={`/sprint/${id}/board`}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "shrink-0"
            )}
          >
            Board view
          </Link>
        </div>

        {/* Learning */}
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium mb-1">
              What we are learning
            </p>
            <p className="text-base font-medium">{plan.whatWeAreLearning}</p>
          </CardContent>
        </Card>

        {/* 5 phases */}
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">The plan</h2>
          {plan.phases.map((phase) => (
            <Card key={phase.timeRange}>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "text-xs font-bold px-2 py-1 rounded-md",
                      TIME_RANGE_COLORS[phase.timeRange] ?? "bg-muted"
                    )}
                  >
                    {phase.timeRange}
                  </span>
                  <CardTitle className="text-base">{phase.label}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <p className="text-sm text-muted-foreground">
                  {phase.teamInstructions}
                </p>
                <div className="flex flex-col gap-3">
                  {phase.personTasks.map((pt) => (
                    <div key={pt.personNumber} className="flex flex-col gap-1">
                      <p className="text-sm font-medium">
                        Person {pt.personNumber}{" "}
                        <span className="font-normal text-muted-foreground">
                          ({pt.roleHint})
                        </span>
                        {": "}
                        {pt.task}
                      </p>
                      <ol className="ml-4 flex flex-col gap-0.5 list-decimal">
                        {pt.steps.map((step, i) => (
                          <li key={i} className="text-sm text-muted-foreground">
                            {step}
                          </li>
                        ))}
                      </ol>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Metrics */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Track these numbers</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-1">
              {plan.metricsToTrack.map((metric, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="mt-0.5 size-4 rounded-sm border border-input shrink-0" />
                  {metric}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Success criteria */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">What success looks like</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <div className="flex gap-2 text-sm">
              <span className="font-medium text-green-700 w-16 shrink-0">
                Strong
              </span>
              <span>{plan.successCriteria.strong}</span>
            </div>
            <div className="flex gap-2 text-sm">
              <span className="font-medium text-amber-700 w-16 shrink-0">
                Mixed
              </span>
              <span>{plan.successCriteria.mixed}</span>
            </div>
            <div className="flex gap-2 text-sm">
              <span className="font-medium text-red-700 w-16 shrink-0">
                Weak
              </span>
              <span>{plan.successCriteria.weak}</span>
            </div>
          </CardContent>
        </Card>

        {/* Deliverables */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              By minute 45, you must have
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-1">
              {plan.endOfSprintDeliverables.map((d, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="mt-0.5 size-4 rounded-sm border border-input shrink-0" />
                  {d}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Next steps */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Next steps</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <div className="flex gap-2 text-sm">
              <span className="font-medium text-green-700 w-16 shrink-0">
                If strong
              </span>
              <span>{plan.nextStepIfStrong}</span>
            </div>
            <div className="flex gap-2 text-sm">
              <span className="font-medium text-red-700 w-16 shrink-0">
                If weak
              </span>
              <span>{plan.nextStepIfWeak}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
