import { Suspense } from "react";
import MainPage from "@/views/main/ui";
import { getSession } from "@/shared/lib/get-session";

export default async function Home() {
  const session = await getSession();
  const isAuthenticated = Boolean(session?.user?.id);

  return (
    <Suspense>
      <MainPage isAuthenticated={isAuthenticated} />
    </Suspense>
  );
}
