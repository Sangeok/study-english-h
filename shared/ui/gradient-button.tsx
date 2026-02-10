"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type ButtonVariant = 'primary' | 'secondary' | 'white' | 'outline';

export interface GradientButtonProps {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: ButtonVariant;
  className?: string;
}

export function GradientButton({
  children,
  onClick,
  disabled = false,
  variant = 'primary',
  className
}: GradientButtonProps) {
  const variantStyles: Record<ButtonVariant, string> = {
    primary: "bg-gradient-to-br from-purple-600 to-violet-600 text-white shadow-lg hover:shadow-xl",
    secondary: "bg-white/20 backdrop-blur-sm text-white hover:bg-white/30",
    white: "bg-white text-purple-600 shadow-lg hover:shadow-xl",
    outline: "bg-white text-purple-900 shadow-md hover:shadow-lg"
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "px-8 py-4 font-semibold rounded-2xl transition-all duration-300",
        "hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </button>
  );
}
