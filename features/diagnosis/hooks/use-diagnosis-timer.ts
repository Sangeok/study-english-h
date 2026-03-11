"use client";

import { useEffect, useRef, useState } from "react";

export function useDiagnosisTimer(initialSeconds: number, onExpire: () => void) {
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    setTimeLeft(initialSeconds);
  }, [initialSeconds]);

  useEffect(() => {
    if (initialSeconds <= 0) {
      onExpireRef.current();
      return;
    }

    const startTime = Date.now();
    let hasExpired = false;

    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const remaining = Math.max(0, initialSeconds - elapsed);

      setTimeLeft(remaining);

      if (remaining === 0 && !hasExpired) {
        hasExpired = true;
        clearInterval(timer);
        onExpireRef.current();
      }
    }, 500);

    return () => clearInterval(timer);
  }, [initialSeconds]);

  const safeTotal = Math.max(initialSeconds, 1);
  const timePercentage = (timeLeft / safeTotal) * 100;
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return {
    timeLeft,
    minutes,
    seconds,
    timePercentage,
    isTimeWarning: timeLeft < 60,
  };
}
