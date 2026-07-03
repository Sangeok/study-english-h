"use client";

import { ReactNode } from "react";
import { tactileButtonClass, type TactileTone } from "./tactile-button";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "white" | "outline";

export interface GradientButtonProps {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: ButtonVariant;
  className?: string;
}

// Legacy variant API mapped onto the new tactile tone system so every
// existing call site upgrades to the pressable button automatically.
const variantTone: Record<ButtonVariant, TactileTone> = {
  primary: "teal",
  secondary: "coral",
  white: "ghost",
  outline: "ghost",
};

export function GradientButton({
  children,
  onClick,
  disabled = false,
  variant = "primary",
  className,
}: GradientButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(tactileButtonClass(variantTone[variant], "lg"), className)}
    >
      {children}
    </button>
  );
}
