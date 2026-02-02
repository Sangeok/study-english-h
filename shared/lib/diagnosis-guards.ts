"use server";

import prisma from "@/lib/db";
import { getSession } from "./get-session";
import { redirect } from "next/navigation";

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

  return {
    hasCompleted: !!diagnosis,
    latestDiagnosis: diagnosis,
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
 * 진단 재실행을 방지하는 가드 함수
 * 이미 진단 완료 시 메인 페이지로 리다이렉트
 */
export async function preventDiagnosisRetake() {
  const session = await getSession();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { hasCompleted } = await checkDiagnosisStatus(session.user.id);

  if (hasCompleted) {
    redirect("/?message=diagnosis_completed");
  }

  return session;
}

