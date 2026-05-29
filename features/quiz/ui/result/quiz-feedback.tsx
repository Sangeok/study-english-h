"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import type { QuizSubmitResponse } from "../../types";
import { QuizFeedbackHeader } from "./quiz-feedback-header";
import { QuizAccuracyCard } from "./quiz-accuracy-card";
import { QuizHintStats } from "./quiz-hint-stats";
import { QuizDetailResults } from "./quiz-detail-results";
import { QuizFeedbackActions } from "./quiz-feedback-actions";
import { Confetti } from "@/shared/ui";
import { useAnimatedCounter } from "@/shared/lib";
import { QUIZ_CONFETTI, QUIZ_PERFORMANCE_THRESHOLDS } from "@/shared/constants/quiz";

interface QuizFeedbackProps {
  result: QuizSubmitResponse;
}

const getPerformanceMessage = (accuracy: number) => {
  if (accuracy >= QUIZ_PERFORMANCE_THRESHOLDS.PERFECT)
    return { emoji: "🌟", title: "완벽해요!", message: "놀라운 실력이에요!" };
  if (accuracy >= QUIZ_PERFORMANCE_THRESHOLDS.EXCELLENT)
    return { emoji: "🎉", title: "훌륭해요!", message: "정말 잘하셨어요!" };
  if (accuracy >= QUIZ_PERFORMANCE_THRESHOLDS.GOOD)
    return { emoji: "👍", title: "잘했어요!", message: "좋은 결과예요!" };
  if (accuracy >= QUIZ_PERFORMANCE_THRESHOLDS.FAIR)
    return { emoji: "💪", title: "좋아요!", message: "계속 노력하세요!" };
  return { emoji: "🌱", title: "시작이에요!", message: "다음엔 더 잘할 거예요!" };
};

function getConfettiCount(isExtraPractice: boolean, accuracy: number): number {
  if (isExtraPractice) return 0;
  if (accuracy >= QUIZ_CONFETTI.HIGH_ACCURACY_THRESHOLD) return QUIZ_CONFETTI.HIGH_COUNT;
  return QUIZ_CONFETTI.LOW_COUNT;
}

export function QuizFeedback({ result }: QuizFeedbackProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { summary, results, isExtraPractice } = result;
  const [showDetails, setShowDetails] = useState(false);

  // (RV8) 퀴즈 완료 시 shop 쿼리 무효화 — todayQuizDone 최신성 보장
  //   staleTime > 0으로 전역 조정되더라도 상점 진입 시 최신값을 조회한다.
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["shop"] });
  }, [queryClient]);

  const displayXP = isExtraPractice ? 0 : summary.xpEarned;
  const xpCounter = useAnimatedCounter(displayXP);
  const performance = getPerformanceMessage(summary.accuracy);
  const confettiCount = getConfettiCount(isExtraPractice, summary.accuracy);

  return (
    <div className="min-h-screen bg-cream-canvas overflow-hidden relative">
      <Confetti count={confettiCount} />
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-20 -right-32 w-96 h-96 bg-teal/15 rounded-full blur-3xl animate-float"
          style={{ animationDuration: "20s" }}
        />
        <div
          className="absolute bottom-20 -left-32 w-96 h-96 bg-coral/12 rounded-full blur-3xl animate-float"
          style={{ animationDuration: "25s", animationDelay: "2s" }}
        />
        <div
          className="absolute top-1/2 left-1/2 w-64 h-64 bg-gold/12 rounded-full blur-3xl animate-float"
          style={{ animationDuration: "30s", animationDelay: "4s" }}
        />
      </div>

      <div className="relative z-10 py-12 px-4 md:px-8">
        <div className="max-w-4xl mx-auto">
          <QuizFeedbackHeader performance={performance} isExtraPractice={isExtraPractice} />
          <QuizAccuracyCard
            summary={summary}
            xpCounter={xpCounter}
            isExtraPractice={isExtraPractice}
            currentStreak={result.currentStreak}
            gamification={result.gamification}
          />
          <QuizHintStats
            hintStats={summary.hintStats}
            xpPenaltyFromHints={summary.xpPenaltyFromHints}
            isExtraPractice={isExtraPractice}
          />
          <QuizDetailResults
            results={results}
            showDetails={showDetails}
            onToggle={() => setShowDetails((prev) => !prev)}
          />
          <QuizFeedbackActions
            onGoMain={() => router.push("/main")}
            onRetry={() => router.push("/quiz")}
            isExtraPractice={isExtraPractice}
          />
        </div>
      </div>
    </div>
  );
}
