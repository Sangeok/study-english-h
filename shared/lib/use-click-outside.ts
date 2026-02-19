"use client";

import { type RefObject, useEffect } from "react";

export function useClickOutside<T extends HTMLElement>(
  ref: RefObject<T | null>,
  isActive: boolean,
  onOutsideClick: () => void
) {
  useEffect(() => {
    if (!isActive) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }

      if (!ref.current?.contains(target)) {
        onOutsideClick();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isActive, onOutsideClick, ref]);
}

