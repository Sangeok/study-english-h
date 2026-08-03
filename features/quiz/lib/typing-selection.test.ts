// @vitest-environment node
/**
 * 타이핑 문항 선정 — 2단계 캐스케이드와 예문 빈칸 처리의 회귀.
 *
 * 지키는 것 둘.
 *   1) 미학습 단어가 나오지 않는 것. 타이핑은 찍을 수 없어 처음 보는 단어를 내면
 *      사실상 100% 오답이고, 그 오답이 SRS 에 1일 간격 부채로 쌓인다.
 *   2) 빈칸 처리가 정답을 남기지 않는 것. 하나라도 남으면 문항이 사라진다.
 */
import { describe, expect, it } from "vitest";
import {
  blankOutWord,
  buildTypingQuestions,
  collectUsedWords,
  selectTypingWords,
  type TypingCandidate,
} from "./typing-selection";

function word(
  id: string,
  text: string,
  meaning: string,
  exampleSentence: string | null = `I will ${text} it.`
): TypingCandidate {
  return { id, word: text, meaning, audioUrl: `https://cdn.test/${id}.mp3`, exampleSentence };
}

const DUE = [word("d1", "borrow", "빌리다"), word("d2", "freeze", "얼다")];
const ENROLLED = [word("e1", "launch", "출시하다"), word("e2", "scrub", "문지르다")];
const EMPTY: readonly TypingCandidate[] = [];

describe("selectTypingWords — 2단계 캐스케이드", () => {
  it("도래 단어가 충분하면 전부 도래에서 나온다", () => {
    const picked = selectTypingWords({ due: DUE, enrolled: ENROLLED, count: 2 });

    expect(picked.map((c) => c.id)).toEqual(["d1", "d2"]);
  });

  it("도래가 1개면 나머지를 편입 목록이 채운다", () => {
    const picked = selectTypingWords({ due: [DUE[0]], enrolled: ENROLLED, count: 2 });

    expect(picked.map((c) => c.id)).toEqual(["d1", "e1"]);
  });

  it("편입 이력이 없으면 0개다 — 레벨 무작위로 떨어지지 않는다", () => {
    // 성공 기준 4. 리스닝의 3단계에 해당하는 폴백이 **없다**는 것이 이 테스트의 요점이다.
    const picked = selectTypingWords({ due: EMPTY, enrolled: EMPTY, count: 2 });

    expect(picked).toEqual([]);
  });

  it("두 단계를 다 거쳐도 부족하면 채운 만큼만 반환한다 — 예외를 던지지 않는다", () => {
    const picked = selectTypingWords({ due: [DUE[0]], enrolled: EMPTY, count: 2 });

    expect(picked).toHaveLength(1);
  });

  it("리스닝이 뽑은 단어는 제외된다", () => {
    const picked = selectTypingWords({
      due: DUE,
      enrolled: ENROLLED,
      excludedWords: ["borrow"],
      count: 2,
    });

    expect(picked.map((c) => c.word)).not.toContain("borrow");
    expect(picked.map((c) => c.id)).toEqual(["d2", "e1"]);
  });

  it("배제 비교는 대소문자·공백을 무시한다 — srs-enrollment 와 같은 규칙", () => {
    const picked = selectTypingWords({
      due: DUE,
      enrolled: EMPTY,
      excludedWords: ["  BORROW "],
      count: 2,
    });

    expect(picked.map((c) => c.word)).not.toContain("borrow");
  });

  it("같은 단어가 두 번 나오지 않는다 — 단계 간 중복 포함", () => {
    const picked = selectTypingWords({
      due: [DUE[0]],
      enrolled: [DUE[0], ENROLLED[0]],
      count: 2,
    });

    expect(picked.map((c) => c.id)).toEqual(["d1", "e1"]);
  });

  it("다어절 관용구는 뽑히지 않는다 — 철자 입력은 단일 단어를 전제로 만든 과제다", () => {
    const idiom = word("i1", "a piece of cake", "식은 죽 먹기");
    const picked = selectTypingWords({ due: [idiom, DUE[0]], enrolled: EMPTY, count: 2 });

    expect(picked.map((c) => c.id)).toEqual(["d1"]);
  });

  it("다어절이 걸러져 부족해도 다음 단계가 자리를 메운다", () => {
    const idiom = word("i1", "let the cat out of the bag", "비밀을 누설하다");
    const picked = selectTypingWords({ due: [idiom], enrolled: ENROLLED, count: 2 });

    expect(picked.map((c) => c.id)).toEqual(["e1", "e2"]);
  });

  it("하이픈 단어는 남는다 — 공백이 없으면 한 단어로 칠 수 있다", () => {
    const hyphenated = word("h1", "well-known", "잘 알려진");
    const picked = selectTypingWords({ due: [hyphenated], enrolled: EMPTY, count: 1 });

    expect(picked.map((c) => c.id)).toEqual(["h1"]);
  });

  it("count 가 0이면 빈 배열이다 — 킬 스위치", () => {
    expect(selectTypingWords({ due: DUE, enrolled: ENROLLED, count: 0 })).toEqual([]);
  });
});

describe("blankOutWord", () => {
  it("단어 경계로 일치하면 빈칸으로 바꾼다", () => {
    expect(blankOutWord("I need to borrow a book.", "borrow")).toBe("I need to ___ a book.");
  });

  it("대소문자를 무시한다", () => {
    expect(blankOutWord("Borrow it now.", "borrow")).toBe("___ it now.");
  });

  it("어형변화만 있으면 처리하지 않는다 — 힌트가 함정이 된다", () => {
    // "Develop good habits." 를 "Develop good ___." 로 주면 habit 인지 habits 인지 헷갈린다.
    expect(blankOutWord("Develop good habits.", "habit")).toBeUndefined();
    expect(blankOutWord("The situation has deteriorated.", "deteriorate")).toBeUndefined();
  });

  it("단어가 아예 없으면 undefined 다", () => {
    expect(blankOutWord("Something else entirely.", "borrow")).toBeUndefined();
  });

  it("여러 번 나오면 전부 치환한다 — 하나라도 남으면 정답이 노출된다", () => {
    const result = blankOutWord("Borrow it, then borrow again.", "borrow");

    expect(result).toBe("___ it, then ___ again.");
    expect(result?.toLowerCase()).not.toContain("borrow");
  });

  it("부분 문자열은 건드리지 않는다", () => {
    // "cat" 을 물을 때 "category" 를 자르면 안 된다.
    expect(blankOutWord("The category is wide.", "cat")).toBeUndefined();
  });
});

describe("buildTypingQuestions", () => {
  it("정답 철자를 담지 않는다", () => {
    const [draft] = buildTypingQuestions([word("v1", "borrow", "빌리다")]);

    expect(Object.keys(draft).sort()).toEqual(["audioUrl", "blankedSentence", "id", "meaning"]);
    expect(JSON.stringify(draft)).not.toContain("borrow");
  });

  it("예문이 없으면 blankedSentence 키 자체가 없다", () => {
    const [draft] = buildTypingQuestions([word("v1", "borrow", "빌리다", null)]);

    expect(draft.blankedSentence).toBeUndefined();
    expect(Object.keys(draft)).not.toContain("blankedSentence");
  });

  it("빈칸 처리에 실패해도 문항은 나온다 — 힌트 1단계만 없어진다", () => {
    const [draft] = buildTypingQuestions([
      word("v1", "habit", "습관", "Develop good habits."),
    ]);

    expect(draft.id).toBe("v1");
    expect(draft.blankedSentence).toBeUndefined();
  });

  it("식별자는 vocabularyId 이고 오디오가 함께 실린다", () => {
    const [draft] = buildTypingQuestions([word("v1", "borrow", "빌리다")]);

    expect(draft.id).toBe("v1");
    expect(draft.audioUrl).toBe("https://cdn.test/v1.mp3");
    expect(draft.meaning).toBe("빌리다");
  });
});

describe("collectUsedWords", () => {
  it("여러 유형의 단어를 한 집합으로 모은다 — 읽기 후보 dedupe seed", () => {
    const used = collectUsedWords(
      [{ word: "borrow" }, { word: "freeze" }],
      [{ word: "launch" }]
    );

    expect([...used].sort()).toEqual(["borrow", "freeze", "launch"]);
  });

  it("빈 그룹을 넘겨도 안전하다", () => {
    expect(collectUsedWords([], []).size).toBe(0);
  });
});
