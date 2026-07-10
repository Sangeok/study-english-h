import type { DiagnosisSubmitAnswer } from "@/entities/question";
import type { DiagnosisResult } from "../types";

// 게스트 진단 캐시 키. 탭 유지 동안만 살아있고(sessionStorage), 가입 후 이관 시 정리한다.
const KEY = "guest-diagnosis";

// answers: submit body와 동일한 20문항 배열(가입 후 재전송용). result: 결과 뷰 재렌더용.
export type GuestDiagnosis = {
  answers: DiagnosisSubmitAnswer[];
  result: DiagnosisResult;
};

// SSR 안전: sessionStorage는 서버에 없으므로 모든 함수 첫 줄에 window 가드를 둔다.
export function saveGuestDiagnosis(data: GuestDiagnosis): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(KEY, JSON.stringify(data));
}

export function readGuestDiagnosis(): GuestDiagnosis | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as GuestDiagnosis;
  } catch {
    return null;
  }
}

export function clearGuestDiagnosis(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(KEY);
}
