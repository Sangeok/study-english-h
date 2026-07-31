// @vitest-environment node
/**
 * 리스닝 문항 선정 — 캐스케이드와 오답 규칙의 회귀.
 *
 * 지키는 것 둘.
 *   1) 세션 읽기 문항의 단어가 리스닝으로 다시 나오지 않는 것. 겹치면 한쪽이 다른 쪽의
 *      정답을 그대로 보여줘 10문항이 실질 9문항이 된다.
 *   2) 정답과 뜻이 같은 오답이 섞이지 않는 것. 같은 레벨에서 뜻이 겹치는 단어가 실측 9.7% 라
 *      규칙 없이 뽑으면 답이 둘인 문항이 나온다.
 */
import { describe, expect, it } from "vitest";
import {
  buildListeningQuestions,
  coreMeaning,
  selectListeningWords,
  type ListeningCandidate,
} from "./listening-selection";

function word(id: string, text: string, meaning: string): ListeningCandidate {
  return { id, word: text, meaning, audioUrl: `https://cdn.test/${id}.mp3` };
}

/** 셔플을 항등으로 고정해 순서를 단언 가능하게 만든다. */
const identity = <T,>(items: T[]): T[] => items;
/** 셔플이 실제로 적용됐는지 보기 위한 결정적 순서 변경. */
const reverse = <T,>(items: T[]): T[] => [...items].reverse();

const DUE = [word("d1", "borrow", "빌리다"), word("d2", "freeze", "얼다"), word("d3", "launch", "출시하다")];
const ENROLLED = [word("e1", "scrub", "문지르다"), word("e2", "assemble", "조립하다")];
const RANDOM = [word("r1", "evacuate", "대피하다"), word("r2", "demolish", "철거하다"), word("r3", "exchange", "교환하다")];

const EMPTY: readonly ListeningCandidate[] = [];

describe("selectListeningWords — 캐스케이드", () => {
  it("도래 단어가 3개 이상이면 전부 도래에서 나온다", () => {
    const picked = selectListeningWords({
      due: DUE,
      enrolled: ENROLLED,
      random: RANDOM,
      excludedWords: [],
      count: 3,
    });

    expect(picked.map((c) => c.id)).toEqual(["d1", "d2", "d3"]);
  });

  it("도래가 1개면 나머지 2개를 편입된 단어가 채운다", () => {
    const picked = selectListeningWords({
      due: [DUE[0]],
      enrolled: ENROLLED,
      random: RANDOM,
      excludedWords: [],
      count: 3,
    });

    expect(picked.map((c) => c.id)).toEqual(["d1", "e1", "e2"]);
  });

  it("편입 이력이 없으면(신규 사용자) 3개 모두 레벨 무작위에서 나온다", () => {
    const picked = selectListeningWords({
      due: EMPTY,
      enrolled: EMPTY,
      random: RANDOM,
      excludedWords: [],
      count: 3,
    });

    expect(picked.map((c) => c.id)).toEqual(["r1", "r2", "r3"]);
  });

  it("세 단계를 다 거쳐도 부족하면 채운 만큼만 반환한다 — 예외를 던지지 않는다", () => {
    const picked = selectListeningWords({
      due: [DUE[0]],
      enrolled: EMPTY,
      random: EMPTY,
      excludedWords: [],
      count: 3,
    });

    expect(picked).toHaveLength(1);
  });

  it("같은 단어가 두 번 나오지 않는다 — 단계 간 중복 포함", () => {
    const picked = selectListeningWords({
      due: [DUE[0]],
      enrolled: [DUE[0], ENROLLED[0]], // 도래와 같은 단어가 편입 목록에도 있다
      random: RANDOM,
      excludedWords: [],
      count: 3,
    });

    expect(new Set(picked.map((c) => c.id)).size).toBe(picked.length);
    expect(picked.map((c) => c.id)).toEqual(["d1", "e1", "r1"]);
  });

  it("배제 단어는 세 단계 모두에서 걸린다", () => {
    // d1(도래) · e1(편입) · r1(무작위) 을 각각 막는다.
    // 세션 읽기 단어와의 중복 배제는 라우트가 반대 방향으로 건다(deduplicateByContent seed) —
    // 리스닝이 읽기보다 먼저 뽑히므로 이 함수는 읽기 단어를 알 수 없다.
    const picked = selectListeningWords({
      due: DUE,
      enrolled: ENROLLED,
      random: RANDOM,
      excludedWords: ["borrow", "scrub", "evacuate"],
      count: 3,
    });

    expect(picked.map((c) => c.word)).not.toContain("borrow");
    expect(picked.map((c) => c.word)).not.toContain("scrub");
    expect(picked.map((c) => c.word)).not.toContain("evacuate");
    expect(picked).toHaveLength(3);
  });

  it("배제 비교는 대소문자·공백을 무시한다 — srs-enrollment 와 같은 규칙", () => {
    const picked = selectListeningWords({
      due: DUE,
      enrolled: EMPTY,
      random: EMPTY,
      excludedWords: ["  BORROW "],
      count: 3,
    });

    expect(picked.map((c) => c.word)).not.toContain("borrow");
  });

  it("count 가 0이면 빈 배열이다 — 오디오 토글로 끈 세션", () => {
    expect(
      selectListeningWords({ due: DUE, enrolled: ENROLLED, random: RANDOM, excludedWords: [], count: 0 })
    ).toEqual([]);
  });
});

describe("coreMeaning", () => {
  it("첫 구분자까지 자르고 어미를 벗긴다", () => {
    expect(coreMeaning("성취하다, 달성하다")).toBe("성취");
    expect(coreMeaning("예약(하다)")).toBe("예약");
  });

  it("유의어 쌍이 같은 값으로 정규화된다", () => {
    expect(coreMeaning("성취하다")).toBe(coreMeaning("성취"));
  });
});

describe("buildListeningQuestions — 오답 보기 규칙", () => {
  const answer = word("a1", "achieve", "성취하다");
  const pool = [
    answer,
    word("p1", "attain", "달성하다"), // 정답과 coreMeaning 이 다르다(달성 vs 성취)
    word("p2", "borrow", "빌리다"),
    word("p3", "freeze", "얼다"),
    word("p4", "launch", "출시하다"),
  ];

  it("보기가 4개이고 정답이 정확히 1개다", () => {
    const [draft] = buildListeningQuestions({ answers: [answer], pool, shuffle: identity });

    expect(draft.options).toHaveLength(4);
    expect(draft.options.filter((o) => o.text === answer.meaning)).toHaveLength(1);
  });

  it("정답과 coreMeaning 이 같은 오답이 없다 — 유의어 충돌 회귀", () => {
    const synonym = word("s1", "accomplish", "성취"); // coreMeaning 이 정답과 같다
    const [draft] = buildListeningQuestions({
      answers: [answer],
      pool: [...pool, synonym],
      shuffle: identity,
    });

    expect(draft.options.map((o) => o.text)).not.toContain("성취");
    const cores = draft.options.map((o) => coreMeaning(o.text));
    expect(new Set(cores).size).toBe(cores.length);
  });

  it("같은 세션의 다른 문항과 보기가 겹치지 않는다", () => {
    const second = word("a2", "obtain", "획득하다");
    const wide = [...pool, second, word("p5", "scrub", "문지르다"), word("p6", "assemble", "조립하다")];

    const drafts = buildListeningQuestions({ answers: [answer, second], pool: wide, shuffle: identity });

    expect(drafts).toHaveLength(2);
    const first = new Set(drafts[0].options.map((o) => o.text));
    const overlap = drafts[1].options.filter((o) => first.has(o.text));
    expect(overlap).toEqual([]);
  });

  it("보기 순서가 셔플된다", () => {
    const [asIs] = buildListeningQuestions({ answers: [answer], pool, shuffle: identity });
    const [flipped] = buildListeningQuestions({ answers: [answer], pool, shuffle: reverse });

    expect(flipped.options.map((o) => o.text)).not.toEqual(asIs.options.map((o) => o.text));
  });

  it("오답을 3개 못 채우면 그 문항은 내지 않는다", () => {
    const drafts = buildListeningQuestions({
      answers: [answer],
      pool: [answer, word("p1", "borrow", "빌리다")], // 오답 후보가 1개뿐
      shuffle: identity,
    });

    expect(drafts).toEqual([]);
  });

  it("문항 식별자는 vocabularyId 이고 audioUrl 이 함께 실린다", () => {
    const [draft] = buildListeningQuestions({ answers: [answer], pool, shuffle: identity });

    expect(draft.id).toBe("a1");
    expect(draft.audioUrl).toBe("https://cdn.test/a1.mp3");
  });

  it("응답 초안에 철자(word)나 정답 표시가 실리지 않는다", () => {
    const [draft] = buildListeningQuestions({ answers: [answer], pool, shuffle: identity });

    expect(Object.keys(draft)).toEqual(["id", "audioUrl", "options"]);
    for (const option of draft.options) {
      expect(Object.keys(option)).toEqual(["text"]);
    }
  });
});
