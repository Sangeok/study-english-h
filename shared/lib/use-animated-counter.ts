"use client";

import { useEffect, useState } from "react";

export function useAnimatedCounter(
  target: number,
  duration: number = 2000,
  steps: number = 60
) {
  const [value, setValue] = useState(0);
  const safeTarget = Math.max(0, target);

  useEffect(() => {
    if (safeTarget <= 0) {
      return;
    }

    const increment = safeTarget / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= safeTarget) {
        setValue(safeTarget);
        clearInterval(timer);
      } else {
        setValue(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [duration, steps, safeTarget]);

  if (safeTarget <= 0) {
    return 0;
  }

  return value;
}
