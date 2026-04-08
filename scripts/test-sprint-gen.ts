// Quick local test for the sprint generator service.
// Run with: npx tsx scripts/test-sprint-gen.ts
import { config } from "dotenv";
config({ path: ".env.local" });
import { generateSprintPlan } from "../src/lib/sprint-generator";

async function main() {
  const team = {
    id: "test-holdmate",
    teamName: "HoldMate",
    passcodeHash: "n/a",
    businessType: "product" as const,
    businessDescription:
      "A magnetic retainer case that snaps to your school locker. High schoolers with braces constantly lose their retainers. This product prevents that with a slim magnetic case that sticks to any locker or flat metal surface.",
    targetCustomer: "High school students with braces, ages 13-18",
    currentStage: "mockup" as const,
    availableTools: [
      "Instagram account",
      "Google Form",
      "Phone contacts to message",
      "School DM/text group",
      "Canva",
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  console.log("Generating sprint plan for HoldMate (3 people, price test)...\n");

  const plan = await generateSprintPlan({
    team,
    personCount: 3,
    learningQuestion:
      "Will high schoolers actually pay $15 for a magnetic retainer case?",
    testTypeId: "price",
  });

  console.log(JSON.stringify(plan, null, 2));
}

main().catch((err) => {
  console.error("FAILED:", err.message);
  process.exit(1);
});
