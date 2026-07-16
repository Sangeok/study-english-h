import prisma from "@/lib/db";
import { DIAGNOSIS_COOLDOWN_DAYS } from "@/shared/constants";
import { getSession } from "./get-session";
import { redirect } from "next/navigation";

const MILLISECONDS_PER_DAY = 1000 * 60 * 60 * 24;

export function calculateDiagnosisRetakeAvailability(
  completedAt: Date,
  now = new Date()
) {
  const daysSinceLastDiagnosis = Math.floor(
    (now.getTime() - completedAt.getTime()) / MILLISECONDS_PER_DAY
  );
  const canRetake = daysSinceLastDiagnosis >= DIAGNOSIS_COOLDOWN_DAYS;

  return {
    canRetake,
    daysUntilRetake: canRetake
      ? 0
      : DIAGNOSIS_COOLDOWN_DAYS - daysSinceLastDiagnosis,
  };
}

/**
 * 사용자의 진단 완료 여부를 확인합니다.
 * @param userId - 사용자 ID
 * @returns 진단 완료 여부 및 최근 진단 정보
 */
export async function checkDiagnosisStatus(userId: string) {
  const diagnosis = await prisma.levelDiagnosis.findFirst({
    where: { userId },
    select: {
      id: true,
      completedAt: true,
      cefrLevel: true,
    },
    orderBy: { completedAt: "desc" },
  });

  if (!diagnosis) {
    return {
      hasCompleted: false,
      latestDiagnosis: null,
      canRetake: true,
      daysUntilRetake: 0,
    };
  }

  const { canRetake, daysUntilRetake } =
    calculateDiagnosisRetakeAvailability(diagnosis.completedAt);

  return {
    hasCompleted: true,
    latestDiagnosis: diagnosis,
    canRetake,
    daysUntilRetake,
  };
}

/**
 * 퀴즈 접근 시 진단 완료를 요구하는 가드 함수
 * 진단 미완료 시 진단 페이지로 리다이렉트
 */
export async function requireDiagnosis() {
  const session = await getSession();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { hasCompleted } = await checkDiagnosisStatus(session.user.id);

  if (!hasCompleted) {
    redirect("/diagnosis?required=true");
  }

  return session;
}

/**
 * 진단 페이지 접근 가드.
 * - 게스트(미인증): 통과(게스트 진단 체험 허용) → null 반환
 * - 인증 사용자: 진단 완료 후 30일 미경과면 메인으로 리다이렉트(재진단 쿨다운)
 */
export async function allowGuestOrPreventRetake() {
  const session = await getSession();

  if (!session?.user?.id) {
    return null; // 게스트 허용
  }

  const { hasCompleted, canRetake, daysUntilRetake } = await checkDiagnosisStatus(session.user.id);

  // 진단을 완료했고, 아직 재진단 기간이 지나지 않았으면 리다이렉트
  if (hasCompleted && !canRetake) {
    redirect(`/?message=diagnosis_cooldown&days=${daysUntilRetake}`);
  }

  return session;
}

