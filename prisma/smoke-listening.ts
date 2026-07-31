/**
 * 리스닝 모드 DB 스모크 — 유닛 테스트가 prisma 를 전부 모킹해서 "한 번도 실행된 적 없는" 것들만 친다.
 *
 * app/api/quiz/daily/route.test.ts 는 `vi.mock("@/lib/db")` 로 전체를 목한다. 따라서
 * 캐스케이드의 세 쿼리는 타입만 통과했을 뿐 실제 Postgres 에서 돌아본 적이 없고,
 * 형태가 틀렸으면 런타임에 던져 **데일리 퀴즈 전체가 500** 이 된다.
 * (P4 에서 같은 스모크가 pg_advisory_xact_lock 의 bigint 요구를 잡았다.)
 *
 * 검사 대상:
 *   1. 캐스케이드 1단계 — userVocabulary.findMany 의 중첩 관계 필터(vocabulary: { level, audioUrl })
 *      + select { vocabulary: { select } } 형태가 실제로 도는가
 *   2. 캐스케이드 2단계 — 같은 형태에서 nextReviewDate 조건만 뺀 것
 *   3. 캐스케이드 3단계 + 오답 풀 — vocabulary.findMany 의 audioUrl: { not: null }
 *   4. 실데이터 문항 생성 — 레벨별로 4지선다가 실제로 만들어지는가.
 *      유의어 충돌(coreMeaning 중복)로 문항이 통째로 버려지는 비율을 함께 측정한다.
 *      규칙이 너무 빡세면 여기서 드러난다.
 *   5. 갭 집계 리더 — QuizSession 조회(listeningCount > 0 + take 창)가 도는가
 *   6. QuizSession 왕복 — Int 컬럼 5개 + @@map("quiz_sessions") 쓰기/삭제
 *   7. 리스닝 힌트 조회 — vocabulary.findUnique select { word }
 *
 * 쓰기는 6번의 세션 1건뿐이고 끝나면 지운다. 그 외는 전부 읽기다.
 *
 * 실행: npx tsx prisma/smoke-listening.ts [email]
 *   email 을 주면 그 유저로, 없으면 아무 유저 1명으로 돈다.
 *
 * 주의: DB 접속이 필요하므로 5432 포트 차단 환경에서는 샌드박스 해제 후 실행.
 */

import prisma from "../lib/db";
import {
  buildListeningQuestions,
  selectListeningWords,
  type ListeningCandidate,
} from "../features/quiz/lib/listening-selection";
import { getListeningGap } from "../entities/user/api/get-listening-gap";
import { LISTENING_QUESTION_COUNT, CEFR_ORDER } from "../shared/constants";

const email = process.argv[2];

let failures = 0;

function pass(label: string, detail: string) {
  console.log(`  OK   ${label} — ${detail}`);
}

function fail(label: string, error: unknown) {
  failures += 1;
  const message = error instanceof Error ? error.message : String(error);
  console.error(`  FAIL ${label}\n       ${message.split("\n")[0]}`);
}

const vocabularySelect = { id: true, word: true, meaning: true, audioUrl: true };

function toCandidates(
  rows: { id: string; word: string; meaning: string; audioUrl: string | null }[]
): ListeningCandidate[] {
  return rows.flatMap((row) =>
    row.audioUrl
      ? [{ id: row.id, word: row.word, meaning: row.meaning, audioUrl: row.audioUrl }]
      : []
  );
}

async function main() {
  const user = email
    ? await prisma.user.findUnique({ where: { email }, select: { id: true, email: true } })
    : await prisma.user.findFirst({ select: { id: true, email: true } });

  if (!user) {
    console.error(email ? `유저 없음: ${email}` : "DB 에 유저가 없다");
    process.exit(1);
  }

  const profile = await prisma.userProfile.findUnique({
    where: { userId: user.id },
    select: { level: true },
  });
  const level = profile?.level ?? "A1";

  console.log(`\n리스닝 DB 스모크 — user=${user.email} level=${level}\n`);

  const audible = { level, audioUrl: { not: null } };
  const now = new Date();

  // 1. 캐스케이드 1단계 — 도래
  let dueRows: { vocabulary: { id: string; word: string; meaning: string; audioUrl: string | null } }[] = [];
  try {
    dueRows = await prisma.userVocabulary.findMany({
      where: { userId: user.id, nextReviewDate: { lte: now }, vocabulary: audible },
      orderBy: { nextReviewDate: "asc" },
      take: LISTENING_QUESTION_COUNT * 4,
      select: { vocabulary: { select: vocabularySelect } },
    });
    pass("1 캐스케이드 도래", `중첩 관계 필터 동작, ${dueRows.length}건`);
  } catch (error) {
    fail("1 캐스케이드 도래", error);
  }

  // 2. 캐스케이드 2단계 — 편입됨
  let enrolledRows: typeof dueRows = [];
  try {
    enrolledRows = await prisma.userVocabulary.findMany({
      where: { userId: user.id, vocabulary: audible },
      take: LISTENING_QUESTION_COUNT * 8,
      select: { vocabulary: { select: vocabularySelect } },
    });
    pass("2 캐스케이드 편입됨", `${enrolledRows.length}건`);
  } catch (error) {
    fail("2 캐스케이드 편입됨", error);
  }

  // 3. 캐스케이드 3단계 + 오답 풀
  let pool: ListeningCandidate[] = [];
  try {
    const poolRows = await prisma.vocabulary.findMany({ where: audible, select: vocabularySelect });
    pool = toCandidates(poolRows);
    pass("3 레벨 풀", `audioUrl 보유 ${pool.length}건 (레벨 ${level})`);
  } catch (error) {
    fail("3 레벨 풀", error);
  }

  // 4. 실데이터로 문항이 만들어지는가 — 레벨 전체를 훑어 유의어 충돌 손실률을 잰다
  try {
    const rows: string[] = [];
    for (const cefr of CEFR_ORDER) {
      const levelPool = toCandidates(
        await prisma.vocabulary.findMany({
          where: { level: cefr, audioUrl: { not: null } },
          select: vocabularySelect,
        })
      );

      if (levelPool.length === 0) {
        rows.push(`${cefr}: 풀 0`);
        continue;
      }

      // 그 레벨의 모든 단어를 정답 후보로 놓고, 4지선다가 만들어지는 비율을 본다.
      //   buildListeningQuestions 는 세션 내 보기 중복도 막으므로 문항별로 따로 부른다.
      let made = 0;
      for (const answer of levelPool) {
        if (buildListeningQuestions({ answers: [answer], pool: levelPool }).length === 1) {
          made += 1;
        }
      }
      const lossRate = (((levelPool.length - made) / levelPool.length) * 100).toFixed(1);
      rows.push(`${cefr}: ${made}/${levelPool.length} 생성 (손실 ${lossRate}%)`);
    }
    pass("4 실데이터 문항 생성", rows.join(" · "));
  } catch (error) {
    fail("4 실데이터 문항 생성", error);
  }

  // 4b. 캐스케이드 전체 경로 — 실제 유저 데이터로 3문항을 뽑아본다
  try {
    const answers = selectListeningWords({
      due: toCandidates(dueRows.map((row) => row.vocabulary)),
      enrolled: toCandidates(enrolledRows.map((row) => row.vocabulary)),
      random: pool,
      count: LISTENING_QUESTION_COUNT,
    });
    const drafts = buildListeningQuestions({ answers, pool });
    const stage =
      dueRows.length > 0 ? "도래" : enrolledRows.length > 0 ? "편입됨" : "무작위";
    pass(
      "4b 캐스케이드 전체",
      `단어 ${answers.length}개(선두 단계=${stage}) → 문항 ${drafts.length}개, 보기 ${drafts[0]?.options.length ?? 0}개`
    );
    if (drafts.length < LISTENING_QUESTION_COUNT) {
      console.log(
        `       주의: 요청 ${LISTENING_QUESTION_COUNT} 중 ${drafts.length}개만 생성됐다(풀 부족 또는 유의어 충돌)`
      );
    }
  } catch (error) {
    fail("4b 캐스케이드 전체", error);
  }

  // 5. 갭 집계 리더
  try {
    const gap = await getListeningGap(user.id);
    pass("5 갭 집계", gap === null ? "null (표본 부족 — 정상)" : `읽기 ${gap.readingRate}% / 듣기 ${gap.listeningRate}%`);
  } catch (error) {
    fail("5 갭 집계", error);
  }

  // 6. QuizSession 왕복 (유일한 쓰기 — 끝나면 지운다)
  let createdId: string | null = null;
  try {
    const created = await prisma.quizSession.create({
      data: {
        userId: user.id,
        readingCount: 7,
        readingCorrect: 5,
        listeningCount: 3,
        listeningCorrect: 2,
        durationSec: 120,
      },
      select: { id: true, listeningCorrect: true, createdAt: true },
    });
    createdId = created.id;
    pass("6 QuizSession 왕복", `생성 ok (listeningCorrect=${created.listeningCorrect})`);
  } catch (error) {
    fail("6 QuizSession 왕복", error);
  } finally {
    if (createdId) {
      await prisma.quizSession.delete({ where: { id: createdId } });
      console.log("       (테스트 세션 삭제됨)");
    }
  }

  // 7. 힌트 조회
  try {
    const target = pool[0];
    if (!target) {
      pass("7 힌트 조회", "건너뜀 (레벨 풀 비어 있음)");
    } else {
      const found = await prisma.vocabulary.findUnique({
        where: { id: target.id },
        select: { word: true },
      });
      pass("7 힌트 조회", `${target.id} → ${found?.word}`);
    }
  } catch (error) {
    fail("7 힌트 조회", error);
  }

  console.log(failures === 0 ? "\n전부 통과\n" : `\n실패 ${failures}건\n`);
  await prisma.$disconnect();
  process.exit(failures === 0 ? 0 : 1);
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
