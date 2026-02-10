import type { DiagnosisStatusResponse } from "@/features/diagnosis";
import type { FeatureCardStatus } from "@/shared/ui";
import type { ReactNode } from "react";
import { getDiagnosisCardStatus, getQuizCardStatus } from "../lib/card-status";

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
}

interface BaseFeatureCardConfig {
  id: string;
  icon: string;
  title: string;
  getDescription: (context: FeatureCardContext) => string;
  getActionLabel: (context: FeatureCardContext) => string;
  getStatus: (context: FeatureCardContext) => FeatureCardStatus;
  getStatusIcon?: (context: FeatureCardContext) => ReactNode;
  getBadge?: () => string;
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
    icon: "📝",
    title: "진단 퀴즈",
    handlerKey: "handleDiagnosisClick",

    getDescription: ({ diagnosisStatus }) => {
      if (!diagnosisStatus?.hasCompleted) {
        return "현재 레벨을 평가하고 맞춤형 추천을 받아보세요";
      }

      if (diagnosisStatus.canRetake) {
        return "재진단이 가능합니다!";
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

    getStatusIcon: ({ diagnosisCompleted }) => {
      if (diagnosisCompleted) {
        return <span className="text-green-600">✓</span>;
      }
      return null;
    }
  },

  {
    id: "quiz",
    icon: "🎮",
    title: "일일 퀴즈",
    handlerKey: "handleQuizClick",

    getDescription: ({ diagnosisCompleted }) => {
      if (diagnosisCompleted) return "맞춤형 퀴즈를 풀어보세요";
      return "진단 완료 후 이용 가능합니다";
    },

    getActionLabel: ({ diagnosisCompleted }) => {
      if (diagnosisCompleted) return "지금 플레이";
      return "잠김";
    },

    getStatus: ({ diagnosisCompleted }) => getQuizCardStatus(diagnosisCompleted),

    getStatusIcon: ({ diagnosisCompleted }) => {
      if (!diagnosisCompleted) {
        return <span className="text-gray-400">🔒</span>;
      }
      return null;
    }
  },

  {
    id: "flashcard",
    icon: "🃏",
    title: "플래시카드",
    handlerKey: "handleFlashcardClick",

    getDescription: () => "SRS 알고리즘으로 효과적인 암기",
    getActionLabel: () => "학습 시작하기",
    getStatus: () => "available"
  },

  {
    id: "speaking",
    icon: "🗣️",
    title: "스피킹 코치",
    handlerKey: "handleComingSoon",
    featureName: "스피킹 코치",

    getDescription: () => "AI 기반 실시간 발음 피드백",
    getActionLabel: () => "곧 제공 예정",
    getStatus: () => "coming-soon",
    getBadge: () => "준비 중"
  }
];
