"use client";

import { useEffect, useRef, useState } from "react";

export function useDiagnosisTimer(
  initialSeconds: number,
  onExpire: () => void,
  resetKey: number = 0
) {
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    // resetKey 또는 initialSeconds 변경 시 타이머 리셋
    setTimeLeft(initialSeconds); // eslint-disable-line react-hooks/set-state-in-effect

    if (initialSeconds <= 0) {
      onExpireRef.current();
      return;
    }

    let startTime = Date.now();
    let pausedElapsed = 0;
    let hasExpired = false;
    let timerId: ReturnType<typeof setInterval> | null = null;

    function tick() {
      const elapsed =
        pausedElapsed + Math.floor((Date.now() - startTime) / 1000);
      const remaining = Math.max(0, initialSeconds - elapsed);

      setTimeLeft(remaining);

      if (remaining === 0 && !hasExpired) {
        hasExpired = true;
        if (timerId !== null) clearInterval(timerId);
        timerId = null;
        onExpireRef.current();
      }
    }

    function startTicking() {
      if (timerId !== null) clearInterval(timerId);
      startTime = Date.now();
      timerId = setInterval(tick, 500);
    }

    function handleVisibilityChange() {
      if (hasExpired) return;

      if (document.hidden) {
        pausedElapsed += Math.floor((Date.now() - startTime) / 1000);
        if (timerId !== null) clearInterval(timerId);
        timerId = null;
      } else {
        startTicking();
      }
    }

    startTicking();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (timerId !== null) clearInterval(timerId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [initialSeconds, resetKey]);

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
