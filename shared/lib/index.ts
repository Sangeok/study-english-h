// 서버 전용 모듈은 직접 경로로 임포트:
//   "@/shared/lib/check-auth"       — requireAuth, requireUnAuth
//   "@/shared/lib/diagnosis-guards" — checkDiagnosisStatus, preventDiagnosisRetake, requireDiagnosis
//   "@/shared/lib/get-session"      — getSession, getSessionFromRequest
export { apiClient, ApiError } from "./api-client";
export { shuffleArray } from "./shuffle-array";
export { queryKeys } from "./query-keys";
export { useAnimatedCounter } from "./use-animated-counter";
export { useProfileStats } from "./use-profile-stats";
export { useRecentActivity } from "./use-recent-activity";
export type { ApiSuccessResponse, ApiErrorResponse, ApiResponse } from "./api-types";
export { isApiError, createSuccessResponse, createErrorResponse } from "./api-types";
export type { ProfileStats } from "./use-profile-stats";
export type { Activity, QuizActivity, FlashcardActivity, QualityCounts, RecentActivityResponse } from "./use-recent-activity";