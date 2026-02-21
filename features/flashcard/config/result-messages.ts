export interface FlashcardResultMessage {
  minAccuracy: number;
  emoji: string;
  title: string;
  motivation: string;
}

export const FLASHCARD_RESULT_MESSAGES: FlashcardResultMessage[] = [
  {
    minAccuracy: 90,
    emoji: "A+",
    title: "Excellent work",
    motivation: "Your review pace is strong. Keep your streak going.",
  },
  {
    minAccuracy: 80,
    emoji: "A",
    title: "Great job",
    motivation: "You are building strong memory retention.",
  },
  {
    minAccuracy: 70,
    emoji: "B",
    title: "Good progress",
    motivation: "A few more cycles will push this to mastery.",
  },
  {
    minAccuracy: 60,
    emoji: "C",
    title: "Nice start",
    motivation: "Review consistently to improve long-term recall.",
  },
  {
    minAccuracy: 0,
    emoji: "R",
    title: "Keep practicing",
    motivation: "Short, frequent review sessions will improve results.",
  },
];
