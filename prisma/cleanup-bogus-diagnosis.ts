/**
 * 기존 오염 데이터 정리 스크립트
 *
 * 타이머 만료로 자동 제출된 진단 기록을 식별하고 삭제합니다.
 * totalScore = 0 인 LevelDiagnosis 레코드는 전체 미답변 자동 제출,
 * totalScore <= 10 인 레코드는 극소수만 답변한 자동 제출로 추정합니다.
 *
 * 실행: npx tsx prisma/cleanup-bogus-diagnosis.ts
 * 주의: --dry-run 플래그 없이 실행하면 실제 삭제가 수행됩니다.
 */

import prisma from "../lib/db";

const BOGUS_SCORE_THRESHOLD = 10;
const isDryRun = process.argv.includes("--dry-run");

async function main() {
  console.log(isDryRun ? "[DRY RUN] 실제 삭제 없음\n" : "[LIVE] 실제 삭제 수행\n");

  const bogusDiagnoses = await prisma.levelDiagnosis.findMany({
    where: {
      totalScore: { lte: BOGUS_SCORE_THRESHOLD },
    },
    include: {
      weaknessAreas: true,
      user: { select: { id: true, email: true, name: true } },
    },
    orderBy: { completedAt: "desc" },
  });

  if (bogusDiagnoses.length === 0) {
    console.log("정리 대상 bogus ��단 기록 없음.");
    return;
  }

  console.log(`발견된 의심 레코드: ${bogusDiagnoses.length}건\n`);
  console.log("─".repeat(60));

  for (const d of bogusDiagnoses) {
    console.log(`  ID: ${d.id}`);
    console.log(`  User: ${d.user.name ?? d.user.email ?? d.user.id}`);
    console.log(`  Score: ${d.totalScore}, Level: ${d.cefrLevel}`);
    console.log(`  Date: ${d.completedAt.toISOString()}`);
    console.log(`  Weakness Areas: ${d.weaknessAreas.length}개`);
    console.log("");
  }

  console.log("─".repeat(60));

  if (isDryRun) {
    console.log("[DRY RUN] 삭제를 수행하려면 --dry-run 플래그 없이 다시 실행하세요.");
    return;
  }

  const userIds = [...new Set(bogusDiagnoses.map((d) => d.userId))];
  const diagnosisIds = bogusDiagnoses.map((d) => d.id);

  // WeaknessArea 먼저 삭제 (FK 의존)
  const deletedWeaknesses = await prisma.weaknessArea.deleteMany({
    where: { diagnosisId: { in: diagnosisIds } },
  });
  console.log(`삭제된 WeaknessArea: ${deletedWeaknesses.count}건`);

  // LevelDiagnosis 삭제
  const deletedDiagnoses = await prisma.levelDiagnosis.deleteMany({
    where: { id: { in: diagnosisIds } },
  });
  console.log(`삭제된 LevelDiagnosis: ${deletedDiagnoses.count}건`);

  // 영향받은 사용자의 UserProfile 확인 및 리셋
  for (const userId of userIds) {
    // 해당 사용자의 남은 유효 진단이 있는지 확인
    const remainingDiagnosis = await prisma.levelDiagnosis.findFirst({
      where: { userId },
      orderBy: { completedAt: "desc" },
    });

    if (remainingDiagnosis) {
      // 유효 진단이 남아있으면 해당 레벨로 업데이트
      await prisma.userProfile.updateMany({
        where: { userId },
        data: { level: remainingDiagnosis.cefrLevel },
      });
      console.log(`User ${userId}: 유효 진단 존재 → level = ${remainingDiagnosis.cefrLevel}`);
    } else {
      // 유효 진단이 없으면 기본값 A1 유지 (UI에서 "미진단" 처리됨)
      console.log(`User ${userId}: 유효 진단 없음 → UI에서 "미진단" 표시 예정`);
    }
  }

  console.log("\n정리 완료.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
