export interface FlashcardResultMessage {
  minAccuracy: number;
  emoji: string;
  title: string;
  motivation: string;
}

export const FLASHCARD_RESULT_MESSAGES: FlashcardResultMessage[] = [
  {
    minAccuracy: 90,
    emoji: "🎉",
    title: "완벽해요!",
    motivation: "복습 속도가 아주 좋아요. 연속 기록을 이어가세요.",
  },
  {
    minAccuracy: 80,
    emoji: "🌟",
    title: "훌륭해요!",
    motivation: "기억력이 탄탄하게 쌓이고 있어요.",
  },
  {
    minAccuracy: 70,
    emoji: "💪",
    title: "잘하고 있어요!",
    motivation: "조금만 더 반복하면 완전히 마스터해요.",
  },
  {
    minAccuracy: 60,
    emoji: "🌱",
    title: "좋은 출발이에요!",
    motivation: "꾸준히 복습하면 장기 기억이 좋아져요.",
  },
  {
    minAccuracy: 0,
    emoji: "🔁",
    title: "계속 연습해요!",
    motivation: "짧고 잦은 복습이 결과를 끌어올려요.",
  },
];
