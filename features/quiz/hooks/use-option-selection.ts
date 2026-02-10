"use client";

import { useCallback, useState } from "react";
import { QUIZ_ANIMATION } from "@/shared/constants/quiz";

interface Sparkle {
  x: number;
  y: number;
  id: number;
}

export function useOptionSelection(
  questionId: string,
  onAnswer: (questionId: string, answer: string) => void
) {
  const [selectingOption, setSelectingOption] = useState<string | null>(null);
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);

  const handleSelect = useCallback(
    (optionText: string) => {
      setSelectingOption(optionText);
      setSparkles(
        Array.from({ length: QUIZ_ANIMATION.SPARKLE_COUNT }, (_, i) => ({
          x: Math.random() * 100,
          y: Math.random() * 100,
          id: Date.now() + i,
        }))
      );
      setTimeout(() => {
        onAnswer(questionId, optionText);
        setSelectingOption(null);
      }, QUIZ_ANIMATION.OPTION_SELECT_DELAY_MS);
      setTimeout(() => setSparkles([]), QUIZ_ANIMATION.SPARKLE_DURATION_MS);
    },
    [questionId, onAnswer]
  );

  return { selectingOption, sparkles, handleSelect };
}
