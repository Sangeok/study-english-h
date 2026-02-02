"use client";

import { useCallback, useState } from "react";
import { useDiagnosisQuiz } from "../hooks/use-diagnosis-quiz";
import { useDiagnosisTimer } from "../hooks/use-diagnosis-timer";
import { DiagnosisProgressBar } from "./diagnosis-progress-bar";
import { DiagnosisQuestionCard } from "./diagnosis-question-card";

export function DiagnosisTest() {
  const { questions, timeLimit, isLoading, isError, submit, isSubmitting } = useDiagnosisQuiz();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleSubmit = useCallback(() => {
    submit(answers);
  }, [submit, answers]);

  const { timeLeft, minutes, seconds, timePercentage, isTimeWarning } = useDiagnosisTimer(timeLimit, handleSubmit);

  const handleAnswer = useCallback((questionId: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  }, []);

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1));
        setIsTransitioning(false);
      }, 300);
    } else {
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex((prev) => Math.max(0, prev - 1));
      setIsTransitioning(false);
    }, 300);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-violet-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-purple-200" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-600 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-3xl">📝</span>
            </div>
          </div>
          <h2 className="text-2xl font-display font-bold text-purple-950 mb-2">문제 준비 중...</h2>
          <p className="text-purple-700">잠시만 기다려주세요</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-violet-50 to-indigo-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">⚠️</span>
          </div>
          <h2 className="text-2xl font-bold text-purple-950 mb-3">문제를 불러올 수 없어요</h2>
          <p className="text-purple-700 mb-8">네트워크 연결을 확인하고 다시 시도해주세요.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-8 py-4 bg-gradient-to-br from-purple-600 to-violet-600 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
          >
            다시 시도하기
          </button>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-violet-50 to-indigo-50 flex items-center justify-center">
        <p className="text-purple-700 text-lg">진단 문제를 불러올 수 없습니다.</p>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;
  const answeredCount = Object.keys(answers).length;
  const isLastQuestion = currentIndex === questions.length - 1;
  const canSubmit = answeredCount === questions.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-violet-50 to-indigo-50 overflow-hidden relative">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-20 -right-32 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl animate-float"
          style={{ animationDuration: "20s" }}
        />
        <div
          className="absolute bottom-20 -left-32 w-96 h-96 bg-violet-200/20 rounded-full blur-3xl animate-float"
          style={{ animationDuration: "25s", animationDelay: "2s" }}
        />
      </div>

      <div className="relative z-10 py-8 px-4 md:px-8">
        <div className="max-w-4xl mx-auto">
          <DiagnosisProgressBar
            currentIndex={currentIndex}
            totalQuestions={questions.length}
            answeredCount={answeredCount}
            progress={progress}
            minutes={minutes}
            seconds={seconds}
            timePercentage={timePercentage}
            isTimeWarning={isTimeWarning}
          />

          <DiagnosisQuestionCard
            question={currentQuestion}
            selectedAnswer={answers[currentQuestion.id]}
            onAnswer={handleAnswer}
            disabled={isSubmitting}
            isTransitioning={isTransitioning}
          />

          <div className="flex items-center justify-between gap-4">
            <button
              onClick={handlePrevious}
              disabled={currentIndex === 0 || isSubmitting}
              className="px-6 py-4 bg-white/80 backdrop-blur-md text-purple-900 font-semibold rounded-2xl border border-purple-200 hover:bg-white hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>이전</span>
            </button>

            <div className="flex-1 text-center">
              {!answers[currentQuestion.id] && <p className="text-sm text-purple-700 animate-pulse">답을 선택해주세요</p>}
            </div>

            {isLastQuestion ? (
              <button
                onClick={handleSubmit}
                disabled={!canSubmit || isSubmitting}
                className="px-8 py-4 bg-gradient-to-br from-purple-600 to-violet-600 text-white font-bold rounded-2xl shadow-xl hover:shadow-2xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-300 flex items-center gap-3"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>제출 중...</span>
                  </>
                ) : (
                  <>
                    <span>제출하기</span>
                    <span className="text-xl">🎯</span>
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={isSubmitting}
                className="px-8 py-4 bg-gradient-to-br from-purple-600 to-violet-600 text-white font-bold rounded-2xl shadow-xl hover:shadow-2xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center gap-2"
              >
                <span>다음</span>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
