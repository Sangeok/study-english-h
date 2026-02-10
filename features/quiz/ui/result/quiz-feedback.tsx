"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { QuizSubmitResponse } from "../../lib/quiz-api";
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

export function QuizFeedback({ result }: QuizFeedbackProps) {
  const router = useRouter();
  const { summary, results } = result;
  const [showDetails, setShowDetails] = useState(false);
  const xpCounter = useAnimatedCounter(summary.xpEarned);
  const performance = getPerformanceMessage(summary.accuracy);
  const confettiCount =
    summary.accuracy >= QUIZ_CONFETTI.HIGH_ACCURACY_THRESHOLD
      ? QUIZ_CONFETTI.HIGH_COUNT
      : QUIZ_CONFETTI.LOW_COUNT;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-violet-50 to-indigo-50 overflow-hidden relative">
      <Confetti count={confettiCount} />
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-20 -right-32 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl animate-float"
          style={{ animationDuration: "20s" }}
        />
        <div
          className="absolute bottom-20 -left-32 w-96 h-96 bg-violet-200/20 rounded-full blur-3xl animate-float"
          style={{ animationDuration: "25s", animationDelay: "2s" }}
        />
        <div
          className="absolute top-1/2 left-1/2 w-64 h-64 bg-indigo-200/20 rounded-full blur-3xl animate-float"
          style={{ animationDuration: "30s", animationDelay: "4s" }}
        />
      </div>

      <div className="relative z-10 py-12 px-4 md:px-8">
        <div className="max-w-4xl mx-auto">
          <QuizFeedbackHeader performance={performance} />
          <QuizAccuracyCard summary={summary} xpCounter={xpCounter} />
          <QuizHintStats
            hintStats={summary.hintStats}
            correctBaseXP={summary.correctBaseXP}
            xpEarned={summary.xpEarned}
          />
          <QuizDetailResults
            results={results}
            showDetails={showDetails}
            onToggle={() => setShowDetails((prev) => !prev)}
          />
          <QuizFeedbackActions onGoMain={() => router.push("/main")} onRetry={() => router.push("/quiz")} />
        </div>
      </div>
    </div>
  );
}
