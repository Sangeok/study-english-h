"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { HEADER_NAV_ITEMS } from "../config/navigation-items";
import { MobileAuthButtons } from "./auth-buttons";
import { MobileUserStatusBadges } from "./user-status-badges";

interface MobileMenuProps {
  pathname: string;
  isAuthenticated: boolean;
  level: string;
  streak: number;
  isSigningOut: boolean;
  onLogin: () => void;
  onSignOut: () => Promise<void>;
}

function getMenuButtonLabel(isMenuOpen: boolean): string {
  if (isMenuOpen) {
    return "모바일 메뉴 닫기";
  }

  return "모바일 메뉴 열기";
}

function getSignOutLabel(isSigningOut: boolean): string {
  if (isSigningOut) {
    return "로그아웃 중...";
  }

  return "로그아웃";
}

export function MobileMenu({
  pathname,
  isAuthenticated,
  level,
  streak,
  isSigningOut,
  onLogin,
  onSignOut,
}: MobileMenuProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const toggleMenu = () => {
    setIsMenuOpen((prev) => !prev);
  };

  const handleLoginClick = () => {
    closeMenu();
    onLogin();
  };

  const handleSignOutClick = async () => {
    closeMenu();
    await onSignOut();
  };

  const menuButtonLabel = getMenuButtonLabel(isMenuOpen);
  const signOutLabel = getSignOutLabel(isSigningOut);

  return (
    <>
      <button
        type="button"
        className="flex h-10 w-10 items-center justify-center rounded-xl border border-chamber-line bg-chamber-panel text-chamber-ink md:hidden"
        onClick={toggleMenu}
        aria-label={menuButtonLabel}
        aria-expanded={isMenuOpen}
      >
        {!isMenuOpen && <Menu size={18} aria-hidden="true" />}
        {isMenuOpen && <X size={18} aria-hidden="true" />}
      </button>

      {isMenuOpen && (
        <div className="border-t border-chamber-line bg-chamber px-4 py-4 md:hidden">
          <nav className="mb-4 flex flex-col gap-1" aria-label="모바일 주요 메뉴">
            {HEADER_NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMenu}
                  className={cn(
                    "rounded-xl px-3 py-2 text-sm font-bold transition-colors",
                    isActive && "bg-chamber-panel-hi text-white",
                    !isActive && "text-chamber-soft hover:bg-chamber-panel hover:text-chamber-ink"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {isAuthenticated && <MobileUserStatusBadges level={level} streak={streak} />}
          {!isAuthenticated && <MobileAuthButtons onLogin={handleLoginClick} />}

          {isAuthenticated && (
            <button
              type="button"
              onClick={handleSignOutClick}
              disabled={isSigningOut}
              className="w-full rounded-xl border border-chamber-line bg-chamber-panel px-3 py-2 text-sm font-bold text-coral disabled:opacity-50"
            >
              {signOutLabel}
            </button>
          )}
        </div>
      )}
    </>
  );
}
