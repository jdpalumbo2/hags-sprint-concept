"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AVAILABLE_TOOLS } from "@/lib/tools";

const BUSINESS_TYPE_OPTIONS = [
  { value: "product", label: "Product" },
  { value: "service", label: "Service" },
  { value: "app", label: "App" },
  { value: "website", label: "Website" },
  { value: "marketplace", label: "Marketplace" },
  { value: "other", label: "Other" },
];

const STAGE_OPTIONS = [
  { value: "idea", label: "Just an idea" },
  { value: "mockup", label: "Mockup or wireframe" },
  { value: "prototype", label: "Working prototype" },
  { value: "landing_page_live", label: "Landing page is live" },
  { value: "has_signups", label: "Have signups or interest" },
  { value: "other", label: "Other" },
];

export default function SignupPage() {
  const router = useRouter();
  const [teamName, setTeamName] = useState("");
  const [passcode, setPasscode] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [businessDescription, setBusinessDescription] = useState("");
  const [targetCustomer, setTargetCustomer] = useState("");
  const [currentStage, setCurrentStage] = useState("");
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function toggleTool(tool: string) {
    setSelectedTools((prev) =>
      prev.includes(tool) ? prev.filter((t) => t !== tool) : [...prev, tool]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (passcode.length < 4) {
      setError("Passcode must be at least 4 characters.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamName,
          passcode,
          businessType,
          businessDescription,
          targetCustomer,
          currentStage,
          availableTools: selectedTools,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      router.push("/team");
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4 py-10">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>New team</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="team-name">Team name</Label>
              <Input
                id="team-name"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="What do you call yourselves?"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="passcode">Passcode</Label>
              <Input
                id="passcode"
                type="text"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Min 4 characters"
                required
              />
              <p className="text-xs text-muted-foreground">
                Pick something your team will remember. Not a password.
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="business-type">What are you building?</Label>
              <Select value={businessType} onValueChange={(val) => setBusinessType(val ?? "")}>
                <SelectTrigger id="business-type" className="w-full">
                  <SelectValue placeholder="Pick one" />
                </SelectTrigger>
                <SelectContent>
                  {BUSINESS_TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="business-description">Describe it</Label>
              <Textarea
                id="business-description"
                value={businessDescription}
                onChange={(e) => setBusinessDescription(e.target.value)}
                placeholder="What are you building and who is it for?"
                rows={3}
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="target-customer">Target customer</Label>
              <Input
                id="target-customer"
                value={targetCustomer}
                onChange={(e) => setTargetCustomer(e.target.value)}
                placeholder="Who would actually use this?"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="current-stage">Where are you right now?</Label>
              <Select value={currentStage} onValueChange={(val) => setCurrentStage(val ?? "")}>
                <SelectTrigger id="current-stage" className="w-full">
                  <SelectValue placeholder="Pick your stage" />
                </SelectTrigger>
                <SelectContent>
                  {STAGE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label>What tools do you have?</Label>
              <div className="grid grid-cols-1 gap-2">
                {AVAILABLE_TOOLS.map((tool) => (
                  <div key={tool} className="flex items-center gap-2">
                    <Checkbox
                      id={`tool-${tool}`}
                      checked={selectedTools.includes(tool)}
                      onCheckedChange={() => toggleTool(tool)}
                    />
                    <Label htmlFor={`tool-${tool}`} className="font-normal cursor-pointer">
                      {tool}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button
              type="submit"
              disabled={
                loading ||
                !teamName ||
                !businessType ||
                !businessDescription ||
                !targetCustomer ||
                !currentStage
              }
            >
              {loading ? "Creating team..." : "Create team"}
            </Button>

            <p className="text-sm text-center text-muted-foreground">
              Already have a team?{" "}
              <Link href="/login" className="underline text-foreground">
                Log in
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
