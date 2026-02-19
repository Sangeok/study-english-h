"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useClickOutside } from "@/shared/lib/use-click-outside";
import { ROUTES } from "@/shared/constants";

interface ProfileMenuProps {
  initial: string;
  displayName: string;
  isSigningOut: boolean;
  onSignOut: () => Promise<void>;
}

function getSignOutLabel(isSigningOut: boolean): string {
  if (isSigningOut) {
    return "로그아웃 중...";
  }

  return "로그아웃";
}

export function ProfileMenu({
  initial,
  displayName,
  isSigningOut,
  onSignOut,
}: ProfileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerButtonRef = useRef<HTMLButtonElement>(null);

  const closeMenu = useCallback(() => {
    setIsOpen(false);
  }, []);

  const closeMenuAndFocusTrigger = useCallback(() => {
    setIsOpen(false);
    triggerButtonRef.current?.focus();
  }, []);

  const toggleMenu = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const handleSignOutClick = useCallback(async () => {
    closeMenu();
    await onSignOut();
  }, [closeMenu, onSignOut]);

  useClickOutside(menuRef, isOpen, closeMenu);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }

      event.preventDefault();
      closeMenuAndFocusTrigger();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [closeMenuAndFocusTrigger, isOpen]);

  const signOutLabel = getSignOutLabel(isSigningOut);

  return (
    <div ref={menuRef} className="relative">
      <button
        ref={triggerButtonRef}
        type="button"
        onClick={toggleMenu}
        className="flex items-center gap-2 rounded-xl border border-purple-200 bg-white px-3 py-2 text-sm text-purple-900 shadow-sm transition-shadow hover:shadow-md"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label="계정 메뉴"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-violet-600 text-xs font-bold text-white">
          {initial}
        </span>
        <span className="max-w-28 truncate font-medium">{displayName}</span>
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-44 overflow-hidden rounded-xl border border-purple-100 bg-white shadow-xl"
        >
          <Link
            href={ROUTES.HOME}
            onClick={closeMenu}
            className="block px-4 py-2.5 text-sm text-purple-800 transition-colors hover:bg-purple-50"
            role="menuitem"
          >
            내 학습 홈
          </Link>
          <button
            type="button"
            onClick={handleSignOutClick}
            disabled={isSigningOut}
            className="w-full px-4 py-2.5 text-left text-sm text-rose-700 transition-colors hover:bg-rose-50 disabled:opacity-50"
            role="menuitem"
          >
            {signOutLabel}
          </button>
        </div>
      )}
    </div>
  );
}

