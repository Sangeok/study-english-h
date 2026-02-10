import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface SectionWrapperProps {
  children: ReactNode;
  className?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
}

export function SectionWrapper({
  children,
  className,
  ...ariaProps
}: SectionWrapperProps) {
  return (
    <section
      className={cn("relative z-10 px-6 py-16 md:px-12 lg:px-20", className)}
      {...ariaProps}
    >
      <div className="max-w-7xl mx-auto">
        {children}
      </div>
    </section>
  );
}
