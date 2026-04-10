import { Suspense } from "react";
import { getSession } from "@/shared/lib/get-session";
import { redirect } from "next/navigation";
import { DashboardPage } from "@/views/dashboard";
import { FullPageSpinner } from "@/shared/ui";

export default async function Dashboard() {
  const session = await getSession();
  if (!session?.user?.id) {
    redirect("/login");
  }

  return (
    <Suspense fallback={<FullPageSpinner message="대시보드 로딩 중..." />}>
      <DashboardPage />
    </Suspense>
  );
}
