import { apiClient } from "@/shared/lib";
import { DEFAULT_QUIZ_COUNT, LISTENING_QUESTION_COUNT } from "@/shared/constants";
import type { DailyQuizResponse, QuizSubmission, QuizSubmitResponse } from "../types";

/**
 * 불리언 → 개수 변환은 **여기 한 곳에서만** 한다.
 *
 * 게이트·훅·쿼리 키는 불리언(isListeningEnabled / listeningIncluded)을 쓰고 와이어는
 * 개수(listening=0|3)를 쓴다. 변환 지점을 정해두지 않으면 두 표현이 코드 전반에서 섞인다 —
 * id → vocabularyId 리맵을 handleAnswer 한 곳으로 묶은 것과 같은 이유다.
 *
 * 상한은 어차피 서버가 다시 클램프하므로(min(요청값, LISTENING_QUESTION_COUNT, count - 1))
 * 여기 값이 커져도 안전하다.
 */
export async function fetchDailyQuiz(
  count: number = DEFAULT_QUIZ_COUNT,
  listeningEnabled: boolean = true
): Promise<DailyQuizResponse> {
  const listening = listeningEnabled ? LISTENING_QUESTION_COUNT : 0;
  return apiClient.get<DailyQuizResponse>(
    `/api/quiz/daily?count=${count}&listening=${listening}`
  );
}

export async function submitQuiz(answers: QuizSubmission[]): Promise<QuizSubmitResponse> {
  return apiClient.post<QuizSubmitResponse>("/api/quiz/submit", { answers });
}

