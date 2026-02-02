"use client";

import { useState, useEffect } from "react";

interface ConfettiProps {
  count?: number;
  colors?: string[];
  delay?: number;
  duration?: number;
}

export function Confetti({
  count = 50,
  colors = ["#a855f7", "#8b5cf6", "#6366f1", "#ec4899", "#f59e0b"],
  delay = 500,
  duration = 5000,
}: ConfettiProps) {
  const [particles, setParticles] = useState<
    Array<{
      id: number;
      left: string;
      color: string;
      delay: string;
      duration: string;
    }>
  >([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setParticles(
        Array.from({ length: count }, (_, i) => ({
          id: i,
          left: `${Math.random() * 100}%`,
          color: colors[Math.floor(Math.random() * colors.length)],
          delay: `${Math.random() * 3}s`,
          duration: `${3 + Math.random() * 2}s`,
        }))
      );
    }, delay);
    return () => clearTimeout(timer);
  }, [count, colors, delay]);

  useEffect(() => {
    if (particles.length === 0) return;
    const timer = setTimeout(() => setParticles([]), duration);
    return () => clearTimeout(timer);
  }, [particles, duration]);

  return (
    <>
      {particles.map((p) => (
        <div
          key={p.id}
          className="confetti-particle"
          style={{
            left: p.left,
            backgroundColor: p.color,
            animationDelay: p.delay,
            animationDuration: p.duration,
          }}
        />
      ))}
    </>
  );
}
