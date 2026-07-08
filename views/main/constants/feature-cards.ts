import type { DiagnosisStatusResponse } from "@/features/diagnosis";
import {
  getDiagnosisCardStatus,
  getQuizCardStatus,
  type FeatureCardStatus,
} from "../lib/card-status";

export interface MainPageHandlers {
  handleQuizClick: () => void;
  handleDiagnosisClick: () => void;
  handleFlashcardClick: () => void;
  handleComingSoon: (feature?: string) => void;
}

type DiagnosisStatus = DiagnosisStatusResponse | undefined;

interface FeatureCardContext {
  diagnosisStatus: DiagnosisStatus;
  diagnosisCompleted: boolean;
  hasCompletedTodayQuiz: boolean;
}

interface BaseFeatureCardConfig {
  id: string;
  title: string;
  getDescription: (context: FeatureCardContext) => string;
  getActionLabel: (context: FeatureCardContext) => string;
  getStatus: (context: FeatureCardContext) => FeatureCardStatus;
}

interface StandardFeatureCardConfig extends BaseFeatureCardConfig {
  handlerKey: Exclude<keyof MainPageHandlers, "handleComingSoon">;
}

interface ComingSoonFeatureCardConfig extends BaseFeatureCardConfig {
  handlerKey: "handleComingSoon";
  featureName: string;
}

export type FeatureCardConfig = StandardFeatureCardConfig | ComingSoonFeatureCardConfig;

export const FEATURE_CARDS: FeatureCardConfig[] = [
  {
    id: "diagnosis",
    title: "진단 퀴즈",
    handlerKey: "handleDiagnosisClick",

    getDescription: ({ diagnosisStatus }) => {
      if (!diagnosisStatus?.hasCompleted) {
        return "현재 레벨을 평가하고 맞춤형 추천을 받아보세요";
      }

      if (diagnosisStatus.canRetake) {
        return "재진단이 가능해요";
      }

      return `${diagnosisStatus.daysUntilRetake ?? 0}일 후 재진단 가능`;
    },

    getActionLabel: ({ diagnosisStatus }) => {
      if (!diagnosisStatus?.hasCompleted) {
        return "평가 시작하기";
      }
      if (diagnosisStatus.canRetake) return "재진단하기";
      return "완료됨";
    },

    getStatus: ({ diagnosisStatus }) => getDiagnosisCardStatus(diagnosisStatus),
  },

  {
    id: "quiz",
    title: "일일 퀴즈",
    handlerKey: "handleQuizClick",

    getDescription: ({ diagnosisCompleted, hasCompletedTodayQuiz }) => {
      if (!diagnosisCompleted) return "진단 완료 후 이용할 수 있어요";
      if (hasCompletedTodayQuiz) return "오늘 퀴즈를 완료했어요 · 추가 연습도 가능해요";
      return "맞춤형 퀴즈를 풀어보세요";
    },

    getActionLabel: ({ diagnosisCompleted, hasCompletedTodayQuiz }) => {
      if (!diagnosisCompleted) return "진단 후 열려요";
      if (hasCompletedTodayQuiz) return "추가 연습하기";
      return "시작하기";
    },

    getStatus: ({ diagnosisCompleted, hasCompletedTodayQuiz }) =>
      getQuizCardStatus(diagnosisCompleted, hasCompletedTodayQuiz),
  },

  {
    id: "flashcard",
    title: "플래시카드",
    handlerKey: "handleFlashcardClick",

    getDescription: () => "SRS 알고리즘으로 효과적인 암기",
    getActionLabel: () => "학습 시작하기",
    getStatus: () => "available"
  },

  {
    id: "speaking",
    title: "스피킹 코치",
    handlerKey: "handleComingSoon",
    featureName: "스피킹 코치",

    getDescription: () => "AI 기반 실시간 발음 피드백",
    getActionLabel: () => "곧 제공 예정",
    getStatus: () => "coming-soon"
  }
];
