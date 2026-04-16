import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/shared/lib/get-session";
import { ShopPage } from "@/views/shop";
import { FullPageSpinner } from "@/shared/ui";

export default async function ShopRoute() {
  const session = await getSession();
  if (!session?.user?.id) {
    redirect("/login");
  }

  return (
    <Suspense fallback={<FullPageSpinner />}>
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-8">
        <div className="max-w-4xl mx-auto px-4">
          <ShopPage />
        </div>
      </div>
    </Suspense>
  );
}
