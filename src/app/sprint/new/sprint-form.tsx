"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TEST_TYPES } from "@/lib/test-types";
import { cn } from "@/lib/utils";

export function SprintForm() {
  const router = useRouter();
  const [personCount, setPersonCount] = useState(1);
  const [learningQuestion, setLearningQuestion] = useState("");
  const [testTypeId, setTestTypeId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/sprints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ personCount, learningQuestion, testTypeId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong building your plan.");
        return;
      }
      router.push(`/sprint/${data.sprintId}`);
    } catch {
      setError("Something went wrong building your plan. Try again.");
    } finally {
      setLoading(false);
    }
  }

  const canSubmit =
    !loading && learningQuestion.trim().length >= 5 && testTypeId !== "";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      {/* Person count */}
      <div className="flex flex-col gap-2">
        <Label className="text-base font-semibold">
          How many people are working today?
        </Label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setPersonCount(n)}
              className={cn(
                "h-10 w-10 rounded-lg border text-sm font-medium transition-colors",
                personCount === n
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-input bg-transparent text-foreground hover:bg-muted"
              )}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Learning question */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="learning-question" className="text-base font-semibold">
          What do you want to learn today?
        </Label>
        <Textarea
          id="learning-question"
          value={learningQuestion}
          onChange={(e) => setLearningQuestion(e.target.value)}
          placeholder="Be specific. Example: Will high schoolers actually pay $15 for this?"
          rows={3}
          required
          minLength={5}
          maxLength={500}
        />
      </div>

      {/* Test type */}
      <div className="flex flex-col gap-2">
        <Label className="text-base font-semibold">Pick a test type</Label>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {TEST_TYPES.map((type) => (
            <label
              key={type.id}
              className={cn(
                "flex cursor-pointer flex-col gap-0.5 rounded-lg border p-3 transition-colors",
                testTypeId === type.id
                  ? "border-primary bg-primary/5"
                  : "border-input hover:bg-muted"
              )}
            >
              <input
                type="radio"
                name="test-type"
                value={type.id}
                checked={testTypeId === type.id}
                onChange={() => setTestTypeId(type.id)}
                className="sr-only"
              />
              <span className="text-sm font-medium">{type.label}</span>
              <span className="text-xs text-muted-foreground">
                {type.description}
              </span>
            </label>
          ))}
        </div>
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <Button type="submit" disabled={!canSubmit} size="lg">
        {loading ? "Designing your test. Hang tight..." : "Generate sprint plan"}
      </Button>

      {loading && (
        <p className="text-center text-sm text-muted-foreground">
          This takes 10-15 seconds. Do not close this page.
        </p>
      )}
    </form>
  );
}
