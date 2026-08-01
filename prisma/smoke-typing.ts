/**
 * 타이핑 모드 DB 스모크 — 유닛 테스트가 prisma 를 전부 모킹해서 "한 번도 실행된 적 없는" 것들만 친다.
 *
 * app/api/quiz/daily/route.test.ts 는 `vi.mock("@/lib/db")` 로 전체를 목한다. 따라서
 * 타이핑 캐스케이드의 두 쿼리는 타입만 통과했을 뿐 실제 Postgres 에서 돌아본 적이 없고,
 * 중첩 관계 필터가 틀렸으면 런타임에 던져 데일리 퀴즈 전체가 500 이 된다.
 *
 * 검사 대상:
 *   1. 캐스케이드 1단계(도래) — userVocabulary.findMany 의 중첩 관계 필터 + select
 *   2. 캐스케이드 2단계(편입) — 같은 형태에서 nextReviewDate 조건만 뺀 것
 *   3. 빈칸 처리 실데이터 검증 — 전 어휘에 blankOutWord 를 돌려 힌트 1단계 보유율과
 *      **정답 노출 0건**을 확인한다. 노출 판정은 반드시 단어 경계 기준이어야 한다:
 *      부분 문자열로 보면 "I can't hear with this ___."(정답 ear)가 오탐으로 잡힌다.
 *   4. QuizSession 왕복 — typingCount·typingCorrect 포함
 *   5. period-stats 집계 — QuizSession 기반 aggregate + 일별 raw SQL
 *
 * 쓰기는 4번의 세션 1건뿐이고 끝나면 지운다. 그 외는 전부 읽기다.
 *
 * 실행: npx tsx prisma/smoke-typing.ts [email]
 *
 * 주의: DB 접속이 필요하므로 5432 포트 차단 환경에서는 샌드박스 해제 후 실행.
 */

import prisma from "../lib/db";
import {
  blankOutWord,
  buildTypingQuestions,
  selectTypingWords,
  type TypingCandidate,
} from "../features/quiz/lib/typing-selection";
import { TYPING_QUESTION_COUNT } from "../shared/constants";

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

const vocabularySelect = {
  id: true,
  word: true,
  meaning: true,
  audioUrl: true,
  exampleSentence: true,
};

type VocabRow = {
  id: string;
  word: string;
  meaning: string;
  audioUrl: string | null;
  exampleSentence: string | null;
};

function toCandidates(rows: VocabRow[]): TypingCandidate[] {
  return rows.flatMap((row) =>
    row.audioUrl
      ? [
          {
            id: row.id,
            word: row.word,
            meaning: row.meaning,
            audioUrl: row.audioUrl,
            exampleSentence: row.exampleSentence,
          },
        ]
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
  const now = new Date();
  const audible = { level, audioUrl: { not: null } };

  console.log(`\n타이핑 DB 스모크 — user=${user.email} level=${level}\n`);

  // 1·2. 캐스케이드 두 단계
  let dueRows: { vocabulary: VocabRow }[] = [];
  let enrolledRows: { vocabulary: VocabRow }[] = [];
  try {
    [dueRows, enrolledRows] = await Promise.all([
      prisma.userVocabulary.findMany({
        where: { userId: user.id, nextReviewDate: { lte: now }, vocabulary: audible },
        orderBy: { nextReviewDate: "asc" },
        take: TYPING_QUESTION_COUNT * 4,
        select: { vocabulary: { select: vocabularySelect } },
      }),
      prisma.userVocabulary.findMany({
        where: { userId: user.id, vocabulary: audible },
        take: TYPING_QUESTION_COUNT * 8,
        select: { vocabulary: { select: vocabularySelect } },
      }),
    ]);
    pass("1·2 캐스케이드", `도래 ${dueRows.length}건 · 편입 ${enrolledRows.length}건`);

    const answers = selectTypingWords({
      due: toCandidates(dueRows.map((r) => r.vocabulary)),
      enrolled: toCandidates(enrolledRows.map((r) => r.vocabulary)),
      count: TYPING_QUESTION_COUNT,
    });
    const drafts = buildTypingQuestions(answers);
    pass("   선정", `단어 ${answers.length}개 → 문항 ${drafts.length}개`);
    if (answers.length === 0) {
      console.log("       (편입 이력이 없어 타이핑 0문항 — 설계상 정상. 퀴즈를 몇 회 푼 뒤 재실행하면 밟힌다)");
    }
  } catch (error) {
    fail("1·2 캐스케이드", error);
  }

  // 3. 빈칸 처리 — 전 어휘 실데이터
  try {
    const all = (await prisma.vocabulary.findMany({ select: vocabularySelect })) as VocabRow[];
    let withHint = 0;
    let standaloneLeaks = 0;

    for (const row of all) {
      if (!row.exampleSentence) continue;
      const blanked = blankOutWord(row.exampleSentence, row.word);
      if (!blanked) continue;

      withHint += 1;
      // 반드시 단어 경계로 본다 — includes() 로 보면 ear/hear 같은 오탐이 잡힌다.
      const standalone = new RegExp(String.raw`\b` + row.word + String.raw`\b`, "i");
      if (standalone.test(blanked)) {
        standaloneLeaks += 1;
        console.error(`       노출: ${row.word} → ${blanked}`);
      }
    }

    const pct = ((withHint / all.length) * 100).toFixed(1);
    if (standaloneLeaks === 0) {
      pass("3 빈칸 처리", `${withHint}/${all.length} (${pct}%) 가 힌트 1단계 보유 · 정답 노출 0건`);
    } else {
      fail("3 빈칸 처리", new Error(`정답이 독립 단어로 남은 문항 ${standaloneLeaks}건`));
    }
  } catch (error) {
    fail("3 빈칸 처리", error);
  }

  // 4. QuizSession 왕복 (유일한 쓰기 — 끝나면 지운다)
  let createdId: string | null = null;
  try {
    const created = await prisma.quizSession.create({
      data: {
        userId: user.id,
        readingCount: 5,
        readingCorrect: 4,
        listeningCount: 3,
        listeningCorrect: 2,
        typingCount: 2,
        typingCorrect: 1,
        durationSec: 300,
      },
      select: { id: true, typingCount: true, typingCorrect: true },
    });
    createdId = created.id;
    pass("4 QuizSession 왕복", `typingCount=${created.typingCount} typingCorrect=${created.typingCorrect}`);

    // 5. period-stats 집계 — 방금 만든 행이 잡히는지
    const startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const agg = await prisma.quizSession.aggregate({
      where: { userId: user.id, createdAt: { gte: startDate } },
      _sum: {
        readingCount: true,
        listeningCount: true,
        typingCount: true,
        readingCorrect: true,
        listeningCorrect: true,
        typingCorrect: true,
        durationSec: true,
      },
    });
    const total =
      (agg._sum.readingCount ?? 0) + (agg._sum.listeningCount ?? 0) + (agg._sum.typingCount ?? 0);

    const daily = await prisma.$queryRaw<{ date: string; count: number; total_time: number }[]>`
      SELECT
        TO_CHAR("createdAt" AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Seoul', 'YYYY-MM-DD') AS date,
        COALESCE(SUM("readingCount" + "listeningCount" + "typingCount"), 0)::int AS count,
        COALESCE(SUM("durationSec"), 0)::int AS total_time
      FROM "quiz_sessions"
      WHERE "userId" = ${user.id} AND "createdAt" >= ${startDate}
      GROUP BY date
    `;

    if (total >= 10 && daily.length > 0) {
      pass("5 period-stats 집계", `문항 합계 ${total} · 일별 ${daily.length}행 (${daily[0]?.count}문항)`);
    } else {
      fail("5 period-stats 집계", new Error(`합계 ${total}, 일별 ${daily.length}행 — 방금 만든 세션이 안 잡혔다`));
    }
  } catch (error) {
    fail("4·5 QuizSession/집계", error);
  } finally {
    if (createdId) {
      await prisma.quizSession.delete({ where: { id: createdId } });
      console.log("       (테스트 세션 삭제됨)");
    }
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
