"use server";

import prisma from "@/lib/db";
import { getSession } from "./get-session";
import { redirect } from "next/navigation";

/**
 * 재진단 허용 기간 (일)
 */
const DIAGNOSIS_COOLDOWN_DAYS = 30;

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

  // 마지막 진단으로부터 경과 일수 계산
  const daysSinceLastDiagnosis = Math.floor(
    (Date.now() - diagnosis.completedAt.getTime()) / (1000 * 60 * 60 * 24)
  );

  const canRetake = daysSinceLastDiagnosis >= DIAGNOSIS_COOLDOWN_DAYS;
  const daysUntilRetake = canRetake ? 0 : DIAGNOSIS_COOLDOWN_DAYS - daysSinceLastDiagnosis;

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
 * 진단 재실행을 방지하는 가드 함수 (30일 제한)
 * 진단 완료 후 30일이 지나지 않았으면 메인 페이지로 리다이렉트
 */
export async function preventDiagnosisRetake() {
  const session = await getSession();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { hasCompleted, canRetake, daysUntilRetake } = await checkDiagnosisStatus(session.user.id);

  // 진단을 완료했고, 아직 재진단 기간이 지나지 않았으면 리다이렉트
  if (hasCompleted && !canRetake) {
    redirect(`/?message=diagnosis_cooldown&days=${daysUntilRetake}`);
  }

  return session;
}

