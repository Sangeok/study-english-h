"use client";

import { ButtonHTMLAttributes, forwardRef, ReactNode } from "react";
import { cn } from "@/lib/utils";

export type TactileTone =
  | "teal"
  | "coral"
  | "gold"
  | "ocean"
  | "grape"
  | "ink"
  | "ghost";

export type TactileSize = "sm" | "md" | "lg";

const toneClass: Record<TactileTone, string> = {
  teal: "tactile-btn--teal",
  coral: "tactile-btn--coral",
  gold: "tactile-btn--gold",
  ocean: "tactile-btn--ocean",
  grape: "tactile-btn--grape",
  ink: "tactile-btn--ink",
  ghost: "tactile-btn--ghost",
};

const sizeClass: Record<TactileSize, string> = {
  sm: "tactile-btn--sm",
  md: "",
  lg: "tactile-btn--lg",
};

/**
 * Class string for the signature 3D pressable button.
 * Use directly on `<Link>` / `<a>` when a non-button element is needed.
 */
export function tactileButtonClass(
  tone: TactileTone = "teal",
  size: TactileSize = "md",
  options?: { block?: boolean; className?: string }
) {
  return cn(
    "tactile-btn",
    toneClass[tone],
    sizeClass[size],
    options?.block && "tactile-btn--block",
    options?.className
  );
}

export interface TactileButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: TactileTone;
  size?: TactileSize;
  block?: boolean;
  children: ReactNode;
}

export const TactileButton = forwardRef<HTMLButtonElement, TactileButtonProps>(
  function TactileButton(
    { tone = "teal", size = "md", block = false, className, children, type, ...rest },
    ref
  ) {
    return (
      <button
        ref={ref}
        type={type ?? "button"}
        className={tactileButtonClass(tone, size, { block, className })}
        {...rest}
      >
        {children}
      </button>
    );
  }
);
