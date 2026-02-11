"use client";

import { useEffect, useRef, useState } from "react";

export function useDiagnosisTimer(
  initialSeconds: number,
  onExpire: () => void
) {
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const onExpireRef = useRef(onExpire);

  // onExpire를 ref로 보관하여 effect deps에서 제외
  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  // initialSeconds 변경 시 리셋
  useEffect(() => {
    setTimeLeft(initialSeconds);
  }, [initialSeconds]);

  // 단일 타이머 effect
  useEffect(() => {
    if (timeLeft <= 0) {
      onExpireRef.current();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          clearInterval(timer);
          onExpireRef.current();
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft <= 0]);

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
