import type { ReactNode } from "react";
import { AppHeader } from "@/widgets/app-header";
import { getAppHeaderData } from "@/widgets/app-header/model/get-app-header-data";

interface ShellLayoutProps {
  children: ReactNode;
}

export default async function ShellLayout({ children }: ShellLayoutProps) {
  const headerData = await getAppHeaderData();

  return (
    <>
      <AppHeader
        isAuthenticated={headerData.isAuthenticated}
        isLoading={false}
        streak={headerData.streak}
        level={headerData.level}
        userName={headerData.userName}
      />
      {children}
    </>
  );
}
