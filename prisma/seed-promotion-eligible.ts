/**
 * 승급 자격 시드 — 특정 유저의 레벨 진행률을 100 으로 만들어 승급 시험을 응시 가능하게 한다.
 *
 * §8 수동 승급 왕복 시나리오를 사람이 직접 확인할 때, 진행률 100 계정을 손으로 만드는
 * 비용을 없애는 것이 목적이다. 진행률 산식(§4-1)의 세 성분을 각각 채운다:
 *
 *   A 성숙도  — 현재 레벨 어휘를 mastered 로 편입해 성숙 점수 합을 TARGET_WORD_UNITS 까지
 *   B 정답률  — 현재 레벨 문항의 정답 시도를 넣어 ACCURACY_WINDOW 창을 만점으로
 *   D 복습부채 — 도래한 복습이 있으면 진행률이 깎인다. --defer-reviews 로만 미래로 민다
 *   그리고 쿨다운(최근 실패 응시)이 있으면 지운다 — 있으면 자격 판정이 cooldown 이다
 *
 * 실행(미리보기, 기본): npx tsx prisma/seed-promotion-eligible.ts <email>
 * 실행(실제 시드):      npx tsx prisma/seed-promotion-eligible.ts <email> --confirm
 * 옵션: --defer-reviews  도래한 복습을 내일로 민다(기존 복습 상태를 바꾸므로 기본 꺼짐)
 *
 * 되돌리기: 이 스크립트가 만든 것은 UserVocabulary(mastered)·UserQuizAttempt 다.
 *   실제 학습 데이터와 섞이므로 자동 롤백은 제공하지 않는다 — 개발 DB 에서만 쓸 것.
 *
 * 주의: DB 접속이 필요하므로 5432 포트 차단 환경에서는 샌드박스 해제 후 실행.
 */

import prisma from "../lib/db";
import { getLevelProgress } from "../entities/user/api/get-level-progress";
import { derivePromotionStatus } from "../entities/user/lib/level-progress";
import { cefrLevelSchema } from "../shared/constants/cefr-schema";
import { LEVEL_PROGRESS, PROMOTION, getNextLevel } from "../shared/constants";

const email = process.argv[2];
const confirmed = process.argv.includes("--confirm");
const deferReviews = process.argv.includes("--defer-reviews");

/** determineMasteryLevel 이 mastered 로 판정하는 조건과 같은 값 — 나중에 복습해도 등급이 유지된다. */
const MASTERED_REPETITIONS = 8;
const MASTERED_INTERVAL_DAYS = 180;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

interface MaturityRow {
  mastery: string;
  count: number;
}

async function main() {
  if (!email || email.startsWith("--")) {
    console.error(
      "사용법: npx tsx prisma/seed-promotion-eligible.ts <email> [--confirm] [--defer-reviews]"
    );
    process.exitCode = 1;
    return;
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true },
  });

  if (!user) {
    console.error(`유저를 찾지 못했습니다: ${email}`);
    process.exitCode = 1;
    return;
  }

  const profile = await prisma.userProfile.findUnique({
    where: { userId: user.id },
    select: { level: true },
  });
  const parsed = cefrLevelSchema.safeParse(profile?.level);
  const level = parsed.success ? parsed.data : "A1";
  const nextLevel = getNextLevel(level);

  if (!nextLevel) {
    console.error(
      `${user.email} 은 최상위 레벨(${level})이라 승급 대상이 아닙니다 — 자격 판정이 max-level 입니다.`
    );
    process.exitCode = 1;
    return;
  }

  const now = new Date();

  // --- 현황 측정 (리더와 같은 술어를 쓴다) ---
  const [maturityRows, recentAttempts, reviewDebt, lastFailed, poolAtLevel] = await Promise.all([
    prisma.$queryRaw<MaturityRow[]>`
      SELECT uv."masteryLevel" AS mastery, COUNT(*)::int AS count
      FROM "user_vocabularies" uv
      JOIN "vocabularies" v ON v."id" = uv."vocabularyId"
      WHERE uv."userId" = ${user.id} AND v."level" = ${level}
      GROUP BY uv."masteryLevel"
    `,
    prisma.userQuizAttempt.findMany({
      where: { userId: user.id, question: { difficulty: level } },
      orderBy: { attemptedAt: "desc" },
      take: LEVEL_PROGRESS.ACCURACY_WINDOW,
      select: { isCorrect: true },
    }),
    prisma.userVocabulary.count({
      where: { userId: user.id, nextReviewDate: { lte: now } },
    }),
    prisma.levelPromotionAttempt.findFirst({
      where: { userId: user.id, passed: false },
      orderBy: { createdAt: "desc" },
      select: { id: true, createdAt: true },
    }),
    prisma.quizQuestion.count({ where: { difficulty: level } }),
  ]);

  const MASTERY_WEIGHT: Record<string, number> = {
    new: 0,
    learning: 1 / 3,
    reviewing: 2 / 3,
    mastered: 1,
  };
  const maturityScoreSum = maturityRows.reduce(
    (sum, row) => sum + (MASTERY_WEIGHT[row.mastery] ?? 0) * row.count,
    0
  );
  const correctCount = recentAttempts.filter((attempt) => attempt.isCorrect).length;
  const rate = recentAttempts.length ? (correctCount / recentAttempts.length) * 100 : 0;
  const before = await getLevelProgress(user.id, level, now);

  console.log(`대상: ${user.email}`);
  console.log(`  레벨 ${level} → 승급 목표 ${nextLevel}`);
  console.log(`  진행률 ${before}`);
  console.log(
    `  A 성숙 점수 합 ${maturityScoreSum.toFixed(1)} / ${LEVEL_PROGRESS.TARGET_WORD_UNITS}`
  );
  console.log(
    `  B 최근 시도 ${recentAttempts.length}회 중 ${correctCount}정답 (${rate.toFixed(0)}%, 만점 기준 ${LEVEL_PROGRESS.ACCURACY_FULL_MARK}% · 볼륨 ${LEVEL_PROGRESS.ACCURACY_MIN_VOLUME})`
  );
  console.log(`  D 복습 도래 ${reviewDebt}개`);
  console.log(
    `  쿨다운 ${lastFailed ? `최근 실패 ${lastFailed.createdAt.toISOString()}` : "없음"}\n`
  );

  // --- 계획 수립 ---
  const plan: string[] = [];

  // A: 부족분만큼 mastered 편입 (mastered 1개 = 점수 1)
  const maturityDeficit = Math.max(0, LEVEL_PROGRESS.TARGET_WORD_UNITS - maturityScoreSum);
  const wordsNeeded = Math.ceil(maturityDeficit);
  let vocabularyToSeed: { id: string }[] = [];

  if (wordsNeeded > 0) {
    const existing = await prisma.userVocabulary.findMany({
      where: { userId: user.id },
      select: { vocabularyId: true },
    });
    const owned = new Set(existing.map((row) => row.vocabularyId));

    const candidates = await prisma.vocabulary.findMany({
      where: { level },
      select: { id: true },
    });
    vocabularyToSeed = candidates.filter((row) => !owned.has(row.id)).slice(0, wordsNeeded);

    if (vocabularyToSeed.length < wordsNeeded) {
      console.warn(
        `  경고: ${level} 레벨에 편입 가능한 어휘가 ${vocabularyToSeed.length}개뿐입니다(필요 ${wordsNeeded}). 진행률이 100 에 못 미칩니다.`
      );
    }
    plan.push(
      `UserVocabulary ${vocabularyToSeed.length}건 생성 — masteryLevel=mastered, nextReviewDate=+${MASTERED_INTERVAL_DAYS}일(부채 0 유지)`
    );
  }

  // B: 창이 만점이 아니면 정답 시도를 채운다
  const accuracyFull =
    recentAttempts.length >= LEVEL_PROGRESS.ACCURACY_MIN_VOLUME &&
    rate >= LEVEL_PROGRESS.ACCURACY_FULL_MARK;
  let attemptsToSeed = 0;
  let questionsForAttempts: { id: string }[] = [];

  if (!accuracyFull) {
    if (poolAtLevel === 0) {
      console.warn(`  경고: ${level} 난이도 문항이 DB 에 없어 정답률을 채울 수 없습니다.`);
    } else {
      // 창(take 50) 전체를 내 정답 시도로 덮는다 — 기존 오답이 창에 남아 희석되지 않도록.
      attemptsToSeed = LEVEL_PROGRESS.ACCURACY_WINDOW;
      questionsForAttempts = await prisma.quizQuestion.findMany({
        where: { difficulty: level },
        select: { id: true },
        take: attemptsToSeed,
      });
      plan.push(
        `UserQuizAttempt ${attemptsToSeed}건 생성 — 전부 정답, attemptedAt 은 어제(오늘 퀴즈 완료 판정 오염 방지)`
      );
    }
  }

  // D: 도래 복습
  if (reviewDebt > 0) {
    if (deferReviews) {
      plan.push(`도래한 복습 ${reviewDebt}건의 nextReviewDate 를 내일로 이동`);
    } else {
      console.warn(
        `  경고: 복습 도래 ${reviewDebt}개가 진행률을 최대 ${Math.min(reviewDebt, LEVEL_PROGRESS.MAX_REVIEW_DEBT_PENALTY)}%p 깎습니다. --defer-reviews 를 주면 밀어냅니다.`
      );
    }
  }

  // 쿨다운
  const cooldownActive =
    lastFailed !== null &&
    now.getTime() - lastFailed.createdAt.getTime() < PROMOTION.RETRY_COOLDOWN_DAYS * MS_PER_DAY;
  if (cooldownActive) {
    plan.push(`쿨다운 유발 중인 실패 응시(LevelPromotionAttempt) 삭제`);
  }

  if (plan.length === 0) {
    console.log("이미 자격을 갖췄습니다 — 시드할 것이 없습니다.");
    await report(user.id, level, now);
    return;
  }

  console.log("수행 계획:");
  for (const line of plan) console.log(`  - ${line}`);

  if (!confirmed) {
    console.log("\n미리보기입니다. 실제로 적용하려면 --confirm 을 붙이세요.");
    return;
  }

  // --- 적용 ---
  console.log("\n적용 중...");

  if (vocabularyToSeed.length > 0) {
    const nextReviewDate = new Date(now.getTime() + MASTERED_INTERVAL_DAYS * MS_PER_DAY);
    const created = await prisma.userVocabulary.createMany({
      data: vocabularyToSeed.map((vocabulary) => ({
        userId: user.id,
        vocabularyId: vocabulary.id,
        masteryLevel: "mastered",
        repetitions: MASTERED_REPETITIONS,
        interval: MASTERED_INTERVAL_DAYS,
        lastReviewDate: now,
        nextReviewDate,
        totalReviews: MASTERED_REPETITIONS,
        correctCount: MASTERED_REPETITIONS,
      })),
      skipDuplicates: true,
    });
    console.log(`  UserVocabulary ${created.count}건 생성`);
  }

  if (attemptsToSeed > 0 && questionsForAttempts.length > 0) {
    // 어제로 백데이트 — hasCompletedTodayQuiz(오늘 KST 카운트)를 건드리지 않는다.
    const base = now.getTime() - MS_PER_DAY;
    const created = await prisma.userQuizAttempt.createMany({
      data: Array.from({ length: attemptsToSeed }, (_, index) => ({
        userId: user.id,
        questionId: questionsForAttempts[index % questionsForAttempts.length].id,
        selectedAnswer: "seed",
        isCorrect: true,
        timeSpent: 5,
        hintLevel: 0,
        attemptedAt: new Date(base + index * 1000),
      })),
    });
    console.log(`  UserQuizAttempt ${created.count}건 생성`);
  }

  if (reviewDebt > 0 && deferReviews) {
    const updated = await prisma.userVocabulary.updateMany({
      where: { userId: user.id, nextReviewDate: { lte: now } },
      data: { nextReviewDate: new Date(now.getTime() + MS_PER_DAY) },
    });
    console.log(`  복습 ${updated.count}건을 내일로 이동`);
  }

  if (cooldownActive) {
    const deleted = await prisma.levelPromotionAttempt.deleteMany({
      where: { userId: user.id, passed: false },
    });
    console.log(`  실패 응시 ${deleted.count}건 삭제`);
  }

  await report(user.id, level, new Date());
}

/** 시드 후 실제 리더로 다시 읽어 자격이 열렸는지 확인한다 — 계획이 아니라 결과를 보고한다. */
async function report(userId: string, level: Parameters<typeof getLevelProgress>[1], now: Date) {
  const progress = await getLevelProgress(userId, level, now);
  const lastFailed = await prisma.levelPromotionAttempt.findFirst({
    where: { userId, passed: false },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });
  const status = derivePromotionStatus(level, progress, lastFailed?.createdAt ?? null, now);

  console.log(`\n결과: 진행률 ${progress} · 자격 ${status.status}`);
  if (status.status === "eligible") {
    console.log("홈 우측 패널에 '승급 시험 응시' 버튼이 뜹니다 (/promotion).");
  } else {
    console.log(
      "아직 eligible 이 아닙니다 — 위 경고를 확인하세요(어휘 부족·복습 부채·쿨다운)."
    );
  }
}

main()
  .catch((error) => {
    console.error("시드 실패:", error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
