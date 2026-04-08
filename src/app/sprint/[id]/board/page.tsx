import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { db } from "@/db";
import { SprintPlanSchema, type SprintPlan } from "@/lib/sprint-generator";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const TIME_RANGE_BG: Record<string, string> = {
  "0-5 min": "bg-slate-700",
  "5-15 min": "bg-blue-700",
  "15-30 min": "bg-green-700",
  "30-40 min": "bg-amber-600",
  "40-45 min": "bg-purple-700",
};

export default async function SprintBoardPage({
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
      <div className="min-h-screen bg-black p-8 flex items-center justify-center">
        <p className="text-red-400 text-2xl">This plan could not be loaded.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      {/* Exit board view */}
      <div className="flex justify-end mb-6">
        <Link
          href={`/sprint/${id}`}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "border-gray-600 text-gray-300 hover:text-white hover:bg-gray-800"
          )}
        >
          Exit board view
        </Link>
      </div>

      {/* Sprint goal */}
      <div className="mb-8">
        <p className="text-lg text-gray-400 uppercase tracking-widest mb-2">
          Sprint goal
        </p>
        <h1 className="text-4xl font-bold leading-tight">{plan.sprintGoal}</h1>
        <p className="text-2xl text-gray-300 mt-2">{plan.whatWeAreLearning}</p>
      </div>

      {/* 5 phases stacked */}
      <div className="flex flex-col gap-6">
        {plan.phases.map((phase) => (
          <div
            key={phase.timeRange}
            className="rounded-xl border border-gray-700 overflow-hidden"
          >
            {/* Phase header */}
            <div
              className={cn(
                "flex items-center gap-4 px-6 py-4",
                TIME_RANGE_BG[phase.timeRange] ?? "bg-gray-700"
              )}
            >
              <span className="text-4xl font-black tracking-tight">
                {phase.timeRange}
              </span>
              <span className="text-2xl font-semibold">{phase.label}</span>
            </div>

            {/* Phase content */}
            <div className="bg-gray-900 px-6 py-4 flex flex-col gap-4">
              <p className="text-xl text-gray-300">{phase.teamInstructions}</p>

              <div className="flex flex-col gap-4">
                {phase.personTasks.map((pt) => (
                  <div key={pt.personNumber} className="flex flex-col gap-2">
                    <p className="text-2xl font-semibold">
                      Person {pt.personNumber}{" "}
                      <span className="text-gray-400 font-normal text-lg">
                        ({pt.roleHint})
                      </span>
                    </p>
                    <p className="text-xl text-gray-200">{pt.task}</p>
                    <ol className="ml-6 flex flex-col gap-1 list-decimal">
                      {pt.steps.map((step, i) => (
                        <li key={i} className="text-lg text-gray-400">
                          {step}
                        </li>
                      ))}
                    </ol>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Metrics + success in a two-col row at the bottom */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-700 bg-gray-900 p-6">
          <p className="text-xl font-semibold text-gray-300 mb-3 uppercase tracking-wide">
            Track these numbers
          </p>
          <ul className="flex flex-col gap-2">
            {plan.metricsToTrack.map((m, i) => (
              <li key={i} className="text-xl text-white flex gap-3">
                <span className="text-gray-500">&#9744;</span>
                {m}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-gray-700 bg-gray-900 p-6">
          <p className="text-xl font-semibold text-gray-300 mb-3 uppercase tracking-wide">
            What success looks like
          </p>
          <div className="flex flex-col gap-2">
            <div className="text-xl">
              <span className="font-bold text-green-400">Strong: </span>
              {plan.successCriteria.strong}
            </div>
            <div className="text-xl">
              <span className="font-bold text-amber-400">Mixed: </span>
              {plan.successCriteria.mixed}
            </div>
            <div className="text-xl">
              <span className="font-bold text-red-400">Weak: </span>
              {plan.successCriteria.weak}
            </div>
          </div>
        </div>
      </div>

      {/* Deliverables */}
      <div className="mt-6 rounded-xl border border-gray-700 bg-gray-900 p-6">
        <p className="text-xl font-semibold text-gray-300 mb-3 uppercase tracking-wide">
          By minute 45, you must have
        </p>
        <ul className="flex flex-col gap-2">
          {plan.endOfSprintDeliverables.map((d, i) => (
            <li key={i} className="text-xl text-white flex gap-3">
              <span className="text-gray-500">&#9744;</span>
              {d}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
