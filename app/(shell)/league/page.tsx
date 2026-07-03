import { Suspense } from "react";
import { getSession } from "@/shared/lib/get-session";
import { redirect } from "next/navigation";
import { LeagueLeaderboard } from "@/features/gamification";
import { FullPageSpinner } from "@/shared/ui";

export default async function LeaguePage() {
  const session = await getSession();
  if (!session?.user?.id) {
    redirect("/login");
  }

  return (
    <Suspense fallback={<FullPageSpinner />}>
      <div className="min-h-screen bg-cream-canvas py-8">
        <div className="max-w-4xl mx-auto px-4">
          <LeagueLeaderboard />
        </div>
      </div>
    </Suspense>
  );
}
