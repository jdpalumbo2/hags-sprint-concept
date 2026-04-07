import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { db } from "@/db";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { LogoutButton } from "./logout-button";

const STAGE_LABELS: Record<string, string> = {
  idea: "Just an idea",
  mockup: "Mockup or wireframe",
  prototype: "Working prototype",
  landing_page_live: "Landing page is live",
  has_signups: "Have signups or interest",
  other: "Other",
};

const TYPE_LABELS: Record<string, string> = {
  product: "Product",
  service: "Service",
  app: "App",
  website: "Website",
  marketplace: "Marketplace",
  other: "Other",
};

export default async function TeamPage() {
  const teamId = await getSession();
  if (!teamId) redirect("/login");

  const team = await db.query.teams.findFirst({
    where: (t, { eq }) => eq(t.id, teamId),
    columns: { passcodeHash: false },
  });

  if (!team) redirect("/login");

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-xl mx-auto flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{team.teamName}</h1>
          <LogoutButton />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Business context</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <span className="text-muted-foreground">Type</span>
              <span>{TYPE_LABELS[team.businessType] ?? team.businessType}</span>

              <span className="text-muted-foreground">Stage</span>
              <span>
                {STAGE_LABELS[team.currentStage] ?? team.currentStage}
              </span>

              <span className="text-muted-foreground">Target customer</span>
              <span>{team.targetCustomer}</span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground uppercase tracking-wide">
                Description
              </span>
              <p className="text-sm">{team.businessDescription}</p>
            </div>

            {team.availableTools.length > 0 && (
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground uppercase tracking-wide">
                  Available tools
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {team.availableTools.map((tool) => (
                    <span
                      key={tool}
                      className="text-xs bg-muted px-2 py-0.5 rounded-md"
                    >
                      {tool}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Link
              href="/team/edit"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              Edit context
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
