"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/shared/constants";
import { HEADER_NAV_ITEMS } from "../model/navigation-items";
import { useAppHeaderActions } from "../model/use-app-header-actions";

interface AppHeaderProps {
  isAuthenticated: boolean;
  isLoading: boolean;
  streak: number;
  level: string;
  userName?: string | null;
}

function getDisplayName(userName?: string | null): string {
  if (!userName) return "Learner";
  const trimmed = userName.trim();
  return trimmed.length > 0 ? trimmed : "Learner";
}

function getInitial(userName?: string | null): string {
  const displayName = getDisplayName(userName);
  return displayName.charAt(0).toUpperCase();
}

export function AppHeader({
  isAuthenticated,
  isLoading,
  streak,
  level,
  userName,
}: AppHeaderProps) {
  const pathname = usePathname();
  const { isSigningOut, moveToLogin, handleSignOut } = useAppHeaderActions();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const displayName = useMemo(() => getDisplayName(userName), [userName]);
  const initial = useMemo(() => getInitial(userName), [userName]);
  const closeMenus = useCallback(() => {
    setIsMobileMenuOpen(false);
    setIsProfileMenuOpen(false);
  }, []);

  useEffect(() => {
    if (!isProfileMenuOpen) {
      return;
    }

    const closeOnOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!profileMenuRef.current?.contains(target)) {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, [isProfileMenuOpen]);

  return (
    <header className="sticky top-0 z-30 border-b border-purple-100/70 bg-white/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-8 lg:px-12">
        <Link href={ROUTES.HOME} className="flex items-center gap-3" onClick={closeMenus}>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 shadow-md">
            <span className="text-lg font-bold text-white">E</span>
          </div>
          <span className="text-lg font-display font-bold text-purple-950 md:text-xl">EnglishFlow</span>
        </Link>

        <nav className="hidden items-center gap-2 lg:flex" aria-label="주요 메뉴">
          {HEADER_NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMenus}
                className={cn(
                  "rounded-xl px-4 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-purple-100 text-purple-900"
                    : "text-purple-700 hover:bg-purple-50 hover:text-purple-900"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {isAuthenticated && !isLoading && (
            <>
              <div className="rounded-full border border-purple-100 bg-white/90 px-3 py-1.5 text-sm font-semibold text-purple-800">
                LEVEL {level}
              </div>
              {streak > 0 && (
                <div className="rounded-full border border-purple-100 bg-white/90 px-3 py-1.5 text-sm font-semibold text-purple-800">
                  {streak}일 연속 학습
                </div>
              )}
            </>
          )}

          {!isAuthenticated && (
            <>
              <button
                type="button"
                onClick={() => {
                  closeMenus();
                  moveToLogin();
                }}
                className="rounded-xl border border-purple-200 bg-white px-4 py-2 text-sm font-semibold text-purple-800 transition-colors hover:bg-purple-50"
              >
                로그인
              </button>
              <button
                type="button"
                onClick={() => {
                  closeMenus();
                  moveToLogin();
                }}
                className="rounded-xl bg-gradient-to-br from-purple-600 to-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition-shadow hover:shadow-lg"
              >
                시작하기
              </button>
            </>
          )}

          {isAuthenticated && (
            <div ref={profileMenuRef} className="relative">
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsProfileMenuOpen((prev) => !prev);
                }}
                className="flex items-center gap-2 rounded-xl border border-purple-200 bg-white px-3 py-2 text-sm text-purple-900 shadow-sm transition-shadow hover:shadow-md"
                aria-haspopup="menu"
                aria-expanded={isProfileMenuOpen}
                aria-label="계정 메뉴"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-violet-600 text-xs font-bold text-white">
                  {initial}
                </span>
                <span className="max-w-28 truncate font-medium">{displayName}</span>
              </button>

              {isProfileMenuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-44 overflow-hidden rounded-xl border border-purple-100 bg-white shadow-xl"
                >
                  <Link
                    href={ROUTES.HOME}
                    onClick={closeMenus}
                    className="block px-4 py-2.5 text-sm text-purple-800 transition-colors hover:bg-purple-50"
                    role="menuitem"
                  >
                    내 학습 홈
                  </Link>
                  <button
                    type="button"
                    onClick={async () => {
                      closeMenus();
                      await handleSignOut();
                    }}
                    disabled={isSigningOut}
                    className="w-full px-4 py-2.5 text-left text-sm text-rose-700 transition-colors hover:bg-rose-50 disabled:opacity-50"
                    role="menuitem"
                  >
                    {isSigningOut ? "로그아웃 중..." : "로그아웃"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-purple-200 bg-white text-purple-700 md:hidden"
          onClick={() => {
            setIsProfileMenuOpen(false);
            setIsMobileMenuOpen((prev) => !prev);
          }}
          aria-label="모바일 메뉴 열기"
          aria-expanded={isMobileMenuOpen}
        >
          {isMobileMenuOpen ? "✕" : "☰"}
        </button>
      </div>

      {isMobileMenuOpen && (
        <div className="border-t border-purple-100 bg-white px-4 py-4 md:hidden">
          <nav className="mb-4 flex flex-col gap-1" aria-label="모바일 주요 메뉴">
            {HEADER_NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMenus}
                  className={cn(
                    "rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-purple-100 text-purple-900"
                      : "text-purple-700 hover:bg-purple-50 hover:text-purple-900"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {isAuthenticated && !isLoading && (
            <div className="mb-4 grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-purple-100 bg-purple-50 px-3 py-2 text-center text-sm font-semibold text-purple-800">
                LEVEL {level}
              </div>
              <div className="rounded-xl border border-purple-100 bg-purple-50 px-3 py-2 text-center text-sm font-semibold text-purple-800">
                {streak > 0 ? `${streak}일 연속` : "연속 학습 0일"}
              </div>
            </div>
          )}

          {!isAuthenticated && (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  closeMenus();
                  moveToLogin();
                }}
                className="rounded-xl border border-purple-200 bg-white px-3 py-2 text-sm font-semibold text-purple-800"
              >
                로그인
              </button>
              <button
                type="button"
                onClick={() => {
                  closeMenus();
                  moveToLogin();
                }}
                className="rounded-xl bg-gradient-to-br from-purple-600 to-violet-600 px-3 py-2 text-sm font-semibold text-white"
              >
                시작하기
              </button>
            </div>
          )}

          {isAuthenticated && (
            <button
              type="button"
              onClick={async () => {
                closeMenus();
                await handleSignOut();
              }}
              disabled={isSigningOut}
              className="w-full rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 disabled:opacity-50"
            >
              {isSigningOut ? "로그아웃 중..." : "로그아웃"}
            </button>
          )}
        </div>
      )}
    </header>
  );
}
