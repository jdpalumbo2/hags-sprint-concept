import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white gap-4">
      <h1 className="text-3xl font-bold text-gray-900">Sprint</h1>
      <p className="text-gray-500">45-minute MVP test sprints.</p>
      <div className="flex flex-col gap-3 mt-4 w-full max-w-xs">
        <Link href="/login" className={cn(buttonVariants({ size: "lg" }))}>
          Log in to your team
        </Link>
        <Link
          href="/signup"
          className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
        >
          Create a new team
        </Link>
      </div>
    </div>
  );
}
