"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import type { QuizSubmitResponse } from "../../types";
import { QuizFeedbackHeader } from "./quiz-feedback-header";
import { QuizAccuracyCard } from "./quiz-accuracy-card";
import { QuizHintStats } from "./quiz-hint-stats";
import { QuizSrsNotice } from "./quiz-srs-notice";
import { QuizDetailResults } from "./quiz-detail-results";
import { QuizFeedbackActions } from "./quiz-feedback-actions";
import { Confetti } from "@/shared/ui";
import { queryKeys, useAnimatedCounter } from "@/shared/lib";
import { QUIZ_CONFETTI, QUIZ_PERFORMANCE_THRESHOLDS } from "@/shared/constants/quiz";

interface QuizFeedbackProps {
  result: QuizSubmitResponse;
}

const getPerformanceMessage = (accuracy: number) => {
  if (accuracy >= QUIZ_PERFORMANCE_THRESHOLDS.PERFECT)
    return { title: "완벽해요", message: "놀라운 실력이에요" };
  if (accuracy >= QUIZ_PERFORMANCE_THRESHOLDS.EXCELLENT)
    return { title: "훌륭해요", message: "정말 잘하고 있어요" };
  if (accuracy >= QUIZ_PERFORMANCE_THRESHOLDS.GOOD)
    return { title: "잘했어요", message: "좋은 결과예요" };
  if (accuracy >= QUIZ_PERFORMANCE_THRESHOLDS.FAIR)
    return { title: "좋아요", message: "꾸준히 이어가고 있어요" };
  return { title: "시작이에요", message: "다음엔 더 잘할 수 있어요" };
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

  // 퀴즈 완료 시 shop 쿼리 무효화 — todayQuizDone 최신성 보장
  //   staleTime > 0으로 전역 조정되더라도 상점 진입 시 최신값을 조회한다.
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.shop.all });
  }, [queryClient]);

  const displayXP = isExtraPractice ? 0 : summary.xpEarned;
  const xpCounter = useAnimatedCounter(displayXP);
  const performance = getPerformanceMessage(summary.accuracy);
  const confettiCount = getConfettiCount(isExtraPractice, summary.accuracy);

  return (
    <div className="min-h-screen bg-cream-canvas overflow-hidden relative">
      <Confetti count={confettiCount} />
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
          <QuizSrsNotice
            srs={summary.srs}
            onGoReview={() => router.push("/flashcard?mode=review")}
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
