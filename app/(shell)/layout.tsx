import type { ReactNode } from "react";
import { AppHeader, getAppHeaderData } from "@/widgets/app-header";

interface ShellLayoutProps {
  children: ReactNode;
}

export default async function ShellLayout({ children }: ShellLayoutProps) {
  const headerData = await getAppHeaderData();

  return (
    <>
      <AppHeader
        isAuthenticated={headerData.isAuthenticated}
        streak={headerData.streak}
        level={headerData.level}
        userName={headerData.userName}
      />
      {children}
    </>
  );
}
