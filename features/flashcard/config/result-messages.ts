export interface FlashcardResultMessage {
  /** 회상률(잊지 않은 카드 비율) 하한. 정답률이 아니다 — 플래시카드에는 채점이 없다. */
  minRetention: number;
  title: string;
  motivation: string;
}

export const FLASHCARD_RESULT_MESSAGES: FlashcardResultMessage[] = [
  {
    minRetention: 90,
    title: "거의 다 기억했어요",
    motivation: "복습 속도가 아주 좋아요. 연속 기록을 이어가요.",
  },
  {
    minRetention: 80,
    title: "훌륭해요",
    motivation: "기억력이 탄탄하게 쌓이고 있어요.",
  },
  {
    minRetention: 70,
    title: "잘하고 있어요",
    motivation: "조금만 더 반복하면 완전히 마스터해요.",
  },
  {
    minRetention: 60,
    title: "좋은 출발이에요",
    motivation: "꾸준히 복습하면 장기 기억이 좋아져요.",
  },
  {
    minRetention: 0,
    title: "계속 연습해요",
    motivation: "짧고 잦은 복습이 결과를 끌어올려요.",
  },
];
