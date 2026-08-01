/**
 * 타이핑 문항 선정 — 2단계 캐스케이드 + 예문 빈칸 처리.
 *
 * 순수 함수다. DB 조회는 호출부(daily 라우트)가 하고, 여기는 조회된 후보 배열만 받는다.
 *
 * **리스닝의 3단계(레벨 무작위)가 없다.** 처음 보는 단어를 타이핑으로 내면 찍을 수 없어
 * 사실상 100% 오답이고, 그 오답이 SRS 에 "모른다"로 새겨져 1일 간격 부채가 매일 쌓인다.
 * 리스닝은 4지선다라 찍기라도 했다.
 */
/** 캐스케이드 입력 단위. 라우트가 Vocabulary 에서 조회해 넘긴다. */
export interface TypingCandidate {
  readonly id: string;
  readonly word: string;
  readonly meaning: string;
  readonly audioUrl: string;
  readonly exampleSentence: string | null;
}

/** 응답 조립 직전 형태 — TypingQuestion 에 type 판별자만 더하면 된다. */
export interface TypingDraft {
  readonly id: string;
  readonly meaning: string;
  readonly audioUrl: string;
  readonly blankedSentence?: string;
}

const BLANK = "___";

/** srs-enrollment 의 단어 비교 규칙과 동일(lowercase + trim). 두 곳이 어긋나면 배제가 새 나간다. */
function normalizeWord(word: string): string {
  return word.toLowerCase().trim();
}

/**
 * 예문에서 정답 단어를 빈칸으로 바꾼다.
 *
 * **단어 경계로 일치할 때만** 처리한다(실측 1,427/1,550 = 92.1%). 어형변화만 있는 문장은
 * 건드리지 않는다 — `habit` 을 물으면서 "Develop good habits." 를 "Develop good ___." 로
 * 주면 사용자가 habit 을 쓸지 habits 를 쓸지 헷갈려 힌트가 함정이 된다.
 *
 * 출현을 **전부** 치환한다. 2회 이상 출현은 실측 1건뿐이지만 하나라도 남으면 정답이 노출된다.
 *
 * 어휘는 전건이 순수 a-z 라(특수문자 0개) 정규식 이스케이프가 필요 없다. 그래도 방어한다 —
 * 콘텐츠가 늘면서 하이픈 단어가 들어오면 이스케이프 없이는 정규식이 깨진다.
 */
export function blankOutWord(sentence: string, word: string): string | undefined {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
  const pattern = new RegExp(String.raw`\b` + escaped + String.raw`\b`, "gi");

  if (!pattern.test(sentence)) {
    return undefined;
  }

  // test() 가 lastIndex 를 움직이므로 새 정규식으로 치환한다.
  const replacer = new RegExp(String.raw`\b` + escaped + String.raw`\b`, "gi");
  return sentence.replace(replacer, BLANK);
}

/**
 * 캐스케이드 — 도래 → 편입. 각 단계는 부족분만 채운다.
 *
 * 두 단계를 다 거쳐도 count 를 못 채우면 채운 만큼만 반환한다(예외 없음).
 * 읽기 문항이 그만큼 늘어나 총 문항 수는 유지된다.
 *
 * excludedWords 에는 **같은 세션의 리스닝 단어**를 넘긴다. 겹치면 한 단어를 두 방식으로
 * 묻게 되어 실질 문항 수가 준다. (읽기 단어와의 중복은 반대 방향에서 막는다 —
 * 타이핑·리스닝이 읽기보다 먼저 뽑히므로 읽기 후보를 deduplicateByContent 로 거른다.)
 */
export function selectTypingWords(params: {
  due: readonly TypingCandidate[];
  enrolled: readonly TypingCandidate[];
  excludedWords?: readonly string[];
  count: number;
}): TypingCandidate[] {
  const { due, enrolled, excludedWords = [], count } = params;

  if (count <= 0) {
    return [];
  }

  // 배제 단어와 "이미 뽑힌 단어"를 한 Set 이 함께 막는다 — 단계 간 중복도 이걸로 걸러진다.
  const blocked = new Set(excludedWords.map(normalizeWord));
  const picked: TypingCandidate[] = [];

  for (const stage of [due, enrolled]) {
    for (const candidate of stage) {
      if (picked.length >= count) {
        return picked;
      }

      const key = normalizeWord(candidate.word);
      if (blocked.has(key)) {
        continue;
      }

      blocked.add(key);
      picked.push(candidate);
    }
  }

  return picked;
}

/** 선정된 단어를 응답 초안으로 만든다. word 는 담지 않는다 — 정답이기 때문이다. */
export function buildTypingQuestions(
  answers: readonly TypingCandidate[]
): TypingDraft[] {
  return answers.map((answer) => {
    const blankedSentence = answer.exampleSentence
      ? blankOutWord(answer.exampleSentence, answer.word)
      : undefined;

    return {
      id: answer.id,
      meaning: answer.meaning,
      audioUrl: answer.audioUrl,
      ...(blankedSentence ? { blankedSentence } : {}),
    };
  });
}

/**
 * 읽기 후보를 거를 때 쓸 단어 집합 — 리스닝·타이핑이 뽑은 단어를 합친다.
 * daily 라우트가 deduplicateByContent 의 seed 로 넘긴다.
 */
export function collectUsedWords(
  ...groups: readonly (readonly { word: string }[])[]
): Set<string> {
  const used = new Set<string>();

  for (const group of groups) {
    for (const item of group) {
      used.add(item.word);
    }
  }

  return used;
}
