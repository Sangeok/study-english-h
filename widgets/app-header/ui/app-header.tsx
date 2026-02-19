"use client";

import { usePathname } from "next/navigation";
import { getDisplayName, getInitial } from "../lib/display-name";
import { useAppHeaderActions } from "../model/use-app-header-actions";
import { DesktopAuthButtons } from "./auth-buttons";
import { DesktopNav } from "./desktop-nav";
import { HeaderLogo } from "./header-logo";
import { MobileMenu } from "./mobile-menu";
import { ProfileMenu } from "./profile-menu";
import { DesktopUserStatusBadges } from "./user-status-badges";

interface AppHeaderProps {
  isAuthenticated: boolean;
  streak: number;
  level: string;
  userName?: string | null;
}

export function AppHeader({ isAuthenticated, streak, level, userName }: AppHeaderProps) {
  const pathname = usePathname();
  const { isSigningOut, moveToLogin, handleSignOut } = useAppHeaderActions();

  const displayName = getDisplayName(userName);
  const initial = getInitial(userName);

  return (
    <header className="sticky top-0 z-30 border-b border-purple-100/70 bg-white/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-8 lg:px-12">
        <HeaderLogo />
        <DesktopNav pathname={pathname} />

        <div className="hidden items-center gap-3 md:flex">
          {isAuthenticated && <DesktopUserStatusBadges level={level} streak={streak} />}
          {!isAuthenticated && <DesktopAuthButtons onLogin={moveToLogin} />}
          {isAuthenticated && (
            <ProfileMenu
              initial={initial}
              displayName={displayName}
              isSigningOut={isSigningOut}
              onSignOut={handleSignOut}
            />
          )}
        </div>

        <MobileMenu
          pathname={pathname}
          isAuthenticated={isAuthenticated}
          level={level}
          streak={streak}
          isSigningOut={isSigningOut}
          onLogin={moveToLogin}
          onSignOut={handleSignOut}
        />
      </div>
    </header>
  );
}

