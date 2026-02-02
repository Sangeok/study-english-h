import { Suspense } from "react";
import MainPage from "@/views/main/ui";

export default function Home() {
  return (
    <Suspense>
      <MainPage />
    </Suspense>
  );
}
