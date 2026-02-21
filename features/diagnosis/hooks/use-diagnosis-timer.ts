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

    let hasExpired = false;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (!hasExpired) {
            hasExpired = true;
            onExpireRef.current();
          }
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

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
