"use client";

import { useEffect, useState } from "react";

export function useXpCounter(target: number, duration: number = 2000, steps: number = 60) {
  const [xpCounter, setXpCounter] = useState(0);

  useEffect(() => {
    if (target <= 0) {
      setXpCounter(0);
      return;
    }

    const increment = target / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setXpCounter(target);
        clearInterval(timer);
      } else {
        setXpCounter(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [duration, steps, target]);

  return xpCounter;
}
