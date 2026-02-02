import { CEFR_LEVELS, DIFFICULTY_WEIGHTS } from "../constants";
import type { DiagnosisAnswer } from "@/entities/question";
import type { DiagnosisResult } from "../types";

export function calculateDiagnosisScore(answers: DiagnosisAnswer[]): DiagnosisResult {
  // 1. 난이도별 가중치 점수 계산
  let totalWeightedScore = 0;
  let maxPossibleScore = 0;

  for (const answer of answers) {
    const weight = DIFFICULTY_WEIGHTS[answer.difficulty] ?? 1;
    maxPossibleScore += weight;
    if (answer.isCorrect) {
      totalWeightedScore += weight;
    }
  }

  const totalScore = maxPossibleScore > 0 ? Math.round((totalWeightedScore / maxPossibleScore) * 100) : 0;

  // 2. CEFR 레벨 매핑
  const cefrLevel = mapScoreToCEFR(totalScore);

  // 3. 약점 영역 분석
  const weaknessAreas = analyzeWeaknesses(answers);

  // 4. 추천 시작 레벨
  const recommendedStartPoint = getRecommendedLevel(cefrLevel, weaknessAreas);

  return { totalScore, cefrLevel, weaknessAreas, recommendedStartPoint };
}

function mapScoreToCEFR(score: number): string {
  if (score >= 96) return "C2";
  if (score >= 81) return "C1";
  if (score >= 61) return "B2";
  if (score >= 41) return "B1";
  if (score >= 21) return "A2";
  return "A1";
}

/**
 * 약점 영역 분석 (정확도 < 60%)
 */
function analyzeWeaknesses(answers: DiagnosisAnswer[]): { category: string; accuracy: number }[] {
  const stats: Record<string, { correct: number; total: number }> = {};

  for (const answer of answers) {
    if (!stats[answer.category]) {
      stats[answer.category] = { correct: 0, total: 0 };
    }
    stats[answer.category].total++;
    if (answer.isCorrect) {
      stats[answer.category].correct++;
    }
  }

  return Object.entries(stats)
    .map(([category, { correct, total }]) => ({
      category,
      accuracy: (correct / total) * 100,
    }))
    .filter((item) => item.accuracy < 60)
    .sort((a, b) => a.accuracy - b.accuracy);
}

function getRecommendedLevel(cefrLevel: string, weaknessAreas: { category: string; accuracy: number }[]): string {
  if (weaknessAreas.length >= 3) {
    const currentIndex = CEFR_LEVELS.indexOf(cefrLevel);
    return currentIndex > 0 ? CEFR_LEVELS[currentIndex - 1] : cefrLevel;
  }
  return cefrLevel;
}
