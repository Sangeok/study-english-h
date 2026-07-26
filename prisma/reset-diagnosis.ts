/**
 * 진단 상태 초기화 스크립트 — 특정 유저를 "진단 전" 상태로 되돌린다.
 *
 * 수행 내용:
 *   1. 대상 유저의 LevelDiagnosis 전부 삭제 (WeaknessArea 는 onDelete: Cascade 로 함께 삭제)
 *      → checkDiagnosisStatus 가 hasCompleted:false 를 반환 → 진단 게이트 재오픈, 쿨다운도 사라짐
 *   2. UserProfile.level → "A1", weaknessAreas → null 리셋
 *   XP·스트릭·어휘 통계 등 다른 데이터는 건드리지 않는다.
 *
 * 실행(미리보기, 기본): npx tsx prisma/reset-diagnosis.ts <email>
 * 실행(실제 초기화):     npx tsx prisma/reset-diagnosis.ts <email> --confirm
 *
 * 주의: DB 접속이 필요하므로 5432 포트 차단 환경에서는 샌드박스 해제 후 실행.
 */

import prisma from "../lib/db";
import { Prisma } from "../lib/generated/prisma/client";

const email = process.argv[2];
const confirmed = process.argv.includes("--confirm");

async function main() {
  if (!email || email.startsWith("--")) {
    console.error("사용법: npx tsx prisma/reset-diagnosis.ts <email> [--confirm]");
    process.exitCode = 1;
    return;
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      name: true,
      email: true,
      profile: { select: { level: true } },
      diagnoses: {
        select: { id: true, cefrLevel: true, totalScore: true, completedAt: true },
        orderBy: { completedAt: "desc" },
      },
    },
  });

  if (!user) {
    console.error(`유저를 찾을 수 없습니다: ${email}`);
    process.exitCode = 1;
    return;
  }

  console.log(confirmed ? "[LIVE] 실제 초기화 수행\n" : "[DRY RUN] 미리보기 (실제 변경 없음)\n");
  console.log(`대상: ${user.name} <${user.email}> (${user.id})`);
  console.log(`현재 프로필 레벨: ${user.profile?.level ?? "(프로필 없음)"}`);
  console.log(`진단 기록: ${user.diagnoses.length}건`);
  for (const d of user.diagnoses) {
    console.log(
      `  - ${d.completedAt.toISOString()} | ${d.cefrLevel} | score ${d.totalScore} | ${d.id}`
    );
  }

  const alreadyPristine =
    user.diagnoses.length === 0 && (user.profile?.level ?? "A1") === "A1";
  if (alreadyPristine) {
    console.log("\n이미 '진단 전' 상태입니다. 변경할 것이 없습니다.");
    return;
  }

  if (!confirmed) {
    console.log("\n실제로 초기화하려면 --confirm 을 붙여 다시 실행하세요.");
    return;
  }

  await prisma.$transaction([
    // WeaknessArea 는 Cascade 로 함께 지워지지만, 명시적으로도 삭제해 의도를 분명히 한다.
    prisma.weaknessArea.deleteMany({
      where: { diagnosisId: { in: user.diagnoses.map((d) => d.id) } },
    }),
    prisma.levelDiagnosis.deleteMany({ where: { userId: user.id } }),
    prisma.userProfile.updateMany({
      where: { userId: user.id },
      data: { level: "A1", weaknessAreas: Prisma.DbNull },
    }),
  ]);

  console.log("\n초기화 완료 → 이제 '진단 전' 상태입니다.");
  console.log(`  삭제된 진단: ${user.diagnoses.length}건`);
  console.log("  프로필 레벨: A1, 약점영역: 초기화");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
