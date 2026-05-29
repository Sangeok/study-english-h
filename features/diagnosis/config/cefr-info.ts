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
    gradient: "from-teal to-teal-edge",
    textColor: "text-teal-edge",
  },
  A2: {
    title: "Elementary",
    description: "기본 의사소통이 가능해요",
    gradient: "from-ocean to-ocean-edge",
    textColor: "text-ocean-edge",
  },
  B1: {
    title: "Intermediate",
    description: "일상 대화를 자연스럽게 할 수 있어요",
    gradient: "from-grape to-grape-edge",
    textColor: "text-grape-edge",
  },
  B2: {
    title: "Upper Intermediate",
    description: "복잡한 주제도 이해할 수 있어요",
    gradient: "from-teal to-ocean",
    textColor: "text-teal-edge",
  },
  C1: {
    title: "Advanced",
    description: "전문적인 영어 사용이 가능해요",
    gradient: "from-gold to-gold-edge",
    textColor: "text-gold-edge",
  },
  C2: {
    title: "Proficiency",
    description: "원어민 수준의 영어를 구사해요",
    gradient: "from-coral to-coral-edge",
    textColor: "text-coral-edge",
  },
};
