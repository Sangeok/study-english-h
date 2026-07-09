/** 퀴즈 문장의 빈칸 표기 — quiz-questions.json 전체에서 밑줄 5개로 통일 */
export const QUIZ_BLANK = "_____";

/**
 * 빈칸을 정답으로 채운 완성 문장을 만든다. 정답은 대소문자가 문장에 맞는
 * QuizOption.text(또는 결과 페이로드의 correctAnswer)를 넘겨야 한다(englishWord는 소문자라 문두에서 깨짐).
 * 정답이 없으면(방어) 원문 그대로 반환한다.
 * String.replace는 첫 번째 _____만 치환한다 — 퀴즈 cloze는 문항당 빈칸 1개 관례(quiz-questions.json 확인).
 */
export function fillBlank(sentence: string, answer?: string): string {
  if (!answer) return sentence;
  return sentence.replace(QUIZ_BLANK, answer);
}
