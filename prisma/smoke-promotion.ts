/**
 * 승급 시험 DB 스모크 — 유닛 테스트가 prisma 를 전부 모킹해서 "한 번도 실행된 적 없는" 것들만 친다.
 *
 * 검사 대상:
 *   1. 성숙도 집계 raw SQL — @@map 테이블명(user_vocabularies·vocabularies)·컬럼 인용·
 *      COUNT(*)::int 캐스트·조인이 실제 Postgres 에서 도는가
 *   2. advisory lock SQL — pg_advisory_xact_lock 은 bigint 를 받으므로
 *      hashtextextended(key::text, 0) 해싱이 필요하다. 문자열 직접 전달은 함수 미존재 에러다
 *   3. LevelPromotionSession 의 String[] (questionIds) 왕복 — 스칼라 배열은 postgresql 전용
 *   4. QuizQuestion.difficulty enum 필터에 CefrLevel 유니온을 넘길 수 있는가
 *   5. getLevelProgress 전체 경로 실호출 (1·4 를 실제 리더로 다시 확인)
 *
 * 쓰기는 3번의 세션 1건뿐이고 끝나면 지운다. 그 외는 전부 읽기다.
 *
 * 실행: npx tsx prisma/smoke-promotion.ts [email]
 *   email 을 주면 그 유저로, 없으면 아무 유저 1명으로 돈다.
 *
 * 주의: DB 접속이 필요하므로 5432 포트 차단 환경에서는 샌드박스 해제 후 실행.
 */

import prisma from "../lib/db";
import { getLevelProgress } from "../entities/user/api/get-level-progress";
import { cefrLevelSchema } from "../shared/constants/cefr-schema";
import { PROMOTION, getNextLevel } from "../shared/constants";

const email = process.argv[2];

interface MaturityRow {
  mastery: string;
  count: number;
}

let failures = 0;

function pass(label: string, detail: string) {
  console.log(`  OK   ${label} — ${detail}`);
}

function fail(label: string, error: unknown) {
  failures += 1;
  const message = error instanceof Error ? error.message : String(error);
  console.error(`  FAIL ${label}\n       ${message.split("\n")[0]}`);
}

async function main() {
  const user = email
    ? await prisma.user.findUnique({ where: { email }, select: { id: true, email: true } })
    : await prisma.user.findFirst({ select: { id: true, email: true } });

  if (!user) {
    console.error(email ? `유저를 찾지 못했습니다: ${email}` : "DB 에 유저가 없습니다.");
    process.exitCode = 1;
    return;
  }

  const profile = await prisma.userProfile.findUnique({
    where: { userId: user.id },
    select: { level: true },
  });
  const parsed = cefrLevelSchema.safeParse(profile?.level);
  const level = parsed.success ? parsed.data : "A1";
  const nextLevel = getNextLevel(level) ?? "A2";

  console.log(`대상 유저: ${user.email} (level=${profile?.level ?? "없음"} → 정규화 ${level})\n`);

  // 1) 성숙도 집계 raw SQL
  try {
    const rows = await prisma.$queryRaw<MaturityRow[]>`
      SELECT uv."masteryLevel" AS mastery, COUNT(*)::int AS count
      FROM "user_vocabularies" uv
      JOIN "vocabularies" v ON v."id" = uv."vocabularyId"
      WHERE uv."userId" = ${user.id} AND v."level" = ${level}
      GROUP BY uv."masteryLevel"
    `;
    const shape = rows.length
      ? `${rows.length}행, 첫 행 ${JSON.stringify(rows[0])}, count 타입=${typeof rows[0].count}`
      : "0행 (이 레벨 어휘 없음 — 쿼리 자체는 성공)";
    pass("성숙도 집계 raw SQL", shape);
  } catch (error) {
    fail("성숙도 집계 raw SQL", error);
  }

  // 2) advisory lock SQL — 트랜잭션 안에서만 유효(_xact_)
  try {
    const lockKey = `promotion:${user.id}`;
    await prisma.$transaction(async (transaction) => {
      await transaction.$queryRaw`
        SELECT pg_advisory_xact_lock(
          hashtextextended(${lockKey}::text, 0)
        )::text AS "lockResult"
      `;
    });
    pass("advisory lock", `promotion:<userId> 획득·해제 (hashtextextended 캐스트 유효)`);
  } catch (error) {
    fail("advisory lock", error);
  }

  // 2b) 해싱 없이 넘기면 실패해야 한다 — 10차 패스에서 잡은 blocker 가 진짜였는지 확인
  try {
    await prisma.$transaction(async (transaction) => {
      await transaction.$queryRaw`SELECT pg_advisory_xact_lock(${`promotion:${user.id}`})::text AS "r"`;
    });
    failures += 1;
    console.error("  FAIL 해싱 없는 lock 이 통과했다 — 10차 패스의 blocker 판정이 틀렸다는 뜻");
  } catch {
    pass("해싱 없는 lock 은 거부됨", "hashtextextended 가 필수라는 근거 확인");
  }

  // 4) enum 필터 + 문항 풀 크기
  try {
    const poolSize = await prisma.quizQuestion.count({ where: { difficulty: nextLevel } });
    const enough = poolSize >= PROMOTION.QUESTION_COUNT;
    pass(
      "QuizQuestion difficulty enum 필터",
      `${nextLevel} 풀 ${poolSize}개 (${enough ? "10개 이상 — 503 분기 미발동" : "10개 미만 — 503 분기 발동"})`
    );
  } catch (error) {
    fail("QuizQuestion difficulty enum 필터", error);
  }

  // 3) String[] 왕복 — 유일한 쓰기. 끝나면 지운다.
  let createdSessionId: string | null = null;
  try {
    const questions = await prisma.quizQuestion.findMany({
      where: { difficulty: nextLevel },
      select: { id: true },
      take: PROMOTION.QUESTION_COUNT,
    });
    const questionIds = questions.map((question) => question.id);

    const created = await prisma.levelPromotionSession.create({
      data: { userId: user.id, toLevel: nextLevel, questionIds },
      select: { id: true },
    });
    createdSessionId = created.id;

    const readBack = await prisma.levelPromotionSession.findUnique({
      where: { id: created.id },
      select: { questionIds: true, consumedAt: true, createdAt: true },
    });

    const roundTripped =
      readBack !== null &&
      readBack.questionIds.length === questionIds.length &&
      readBack.questionIds.every((id, index) => id === questionIds[index]);

    if (roundTripped) {
      pass(
        "LevelPromotionSession String[] 왕복",
        `${questionIds.length}개 순서 보존, consumedAt=${readBack?.consumedAt ?? "null"}`
      );
    } else {
      fail("LevelPromotionSession String[] 왕복", new Error("읽어온 questionIds 가 다르다"));
    }
  } catch (error) {
    fail("LevelPromotionSession String[] 왕복", error);
  } finally {
    if (createdSessionId) {
      await prisma.levelPromotionSession.delete({ where: { id: createdSessionId } });
      console.log(`       (정리) 스모크 세션 ${createdSessionId} 삭제`);
    }
  }

  // 5) getLevelProgress 전체 경로
  try {
    const progress = await getLevelProgress(user.id, level);
    const valid = Number.isInteger(progress) && progress >= 0 && progress <= 100;
    if (valid) {
      pass("getLevelProgress 실호출", `진행률 ${progress} (정수·0~100)`);
    } else {
      fail("getLevelProgress 실호출", new Error(`범위를 벗어난 값: ${progress}`));
    }
  } catch (error) {
    fail("getLevelProgress 실호출", error);
  }

  // 쿨다운 리더도 한 번 친다 — stats·start 라우트가 쓰는 질의다
  try {
    const lastFailed = await prisma.levelPromotionAttempt.findFirst({
      where: { userId: user.id, passed: false },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    });
    pass("LevelPromotionAttempt 쿨다운 조회", `최근 실패 ${lastFailed?.createdAt ?? "없음"}`);
  } catch (error) {
    fail("LevelPromotionAttempt 쿨다운 조회", error);
  }

  console.log(
    failures === 0
      ? "\n전부 통과 — 승급 경로의 DB 가정이 실제 Postgres 에서 성립한다."
      : `\n${failures}건 실패 — 위 메시지 참조.`
  );
  if (failures > 0) process.exitCode = 1;
}

main()
  .catch((error) => {
    console.error("스모크 실행 실패:", error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
