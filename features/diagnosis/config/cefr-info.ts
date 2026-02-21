export interface CEFRInfo {
  title: string;
  description: string;
  gradient: string;
  textColor: string;
}

export const CEFR_INFO: Record<string, CEFRInfo> = {
  A1: {
    title: "Beginner",
    description: "기초 단계를 완성하고 있어요",
    gradient: "from-emerald-400 to-teal-500",
    textColor: "text-emerald-700",
  },
  A2: {
    title: "Elementary",
    description: "기본 의사소통이 가능해요",
    gradient: "from-blue-400 to-cyan-500",
    textColor: "text-blue-700",
  },
  B1: {
    title: "Intermediate",
    description: "일상 대화를 자연스럽게 할 수 있어요",
    gradient: "from-violet-400 to-purple-500",
    textColor: "text-violet-700",
  },
  B2: {
    title: "Upper Intermediate",
    description: "복잡한 주제도 이해할 수 있어요",
    gradient: "from-purple-500 to-indigo-600",
    textColor: "text-purple-700",
  },
  C1: {
    title: "Advanced",
    description: "전문적인 영어 사용이 가능해요",
    gradient: "from-amber-400 to-orange-500",
    textColor: "text-amber-700",
  },
  C2: {
    title: "Proficiency",
    description: "원어민 수준의 영어를 구사해요",
    gradient: "from-rose-400 to-pink-500",
    textColor: "text-rose-700",
  },
};
