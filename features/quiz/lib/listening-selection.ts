/**
 * 리스닝 문항 선정 — 캐스케이드 + 오답 보기 조합.
 *
 * 순수 함수다. DB 조회는 호출부(daily 라우트)가 하고, 여기는 이미 조회된 후보 배열만 받는다.
 * 세 단계의 조회 조건(level = 현재 레벨 ∧ audioUrl ≠ null)은 호출부가 건다 —
 * 그래서 ListeningCandidate.audioUrl 이 non-null 이고 여기서 다시 거르지 않는다.
 */
import { shuffleArray } from "@/shared/lib";
import type { QuestionOption } from "@/entities/question";

/** 캐스케이드·오답 조합의 입력 단위. 라우트가 Vocabulary 에서 조회해 넘긴다. */
export interface ListeningCandidate {
  readonly id: string;
  readonly word: string;
  readonly meaning: string;
  readonly audioUrl: string;
}

/** 응답 조립 직전 형태 — ListeningQuestion 에 type 판별자만 더하면 된다. */
export interface ListeningDraft {
  readonly id: string;
  readonly audioUrl: string;
  readonly options: readonly QuestionOption[];
}

const OPTION_COUNT = 4;
const DISTRACTOR_COUNT = OPTION_COUNT - 1;

/**
 * 한국어 뜻의 핵심부 — 조사·접미 변화를 흡수한다.
 *
 * quiz/daily 의 deduplicateByContent 와 같은 *목적*(내용 기준 중복 제거)이되 방식은 다르다:
 * 그쪽은 englishWord 완전 일치를 Set 으로 거르고, 이쪽은 정규화 후 비교하는 퍼지 매칭이다.
 * 파생어 쌍(consider/consideration)은 놓친다 — 실제 충돌이 보고되면 규칙을 콘텐츠 파이프라인의
 * validate 단계로 올린다.
 */
export function coreMeaning(meaning: string): string {
  return meaning
    .split(/[,;/()]/)[0]
    .trim()
    .replace(/(하다|되다|시키다|한|적인|의)$/g, "");
}

/** srs-enrollment 의 단어 비교 규칙과 동일(lowercase + trim). 두 곳이 어긋나면 배제가 새 나간다. */
function normalizeWord(word: string): string {
  return word.toLowerCase().trim();
}

/**
 * 캐스케이드 — 도래 → 편입됨 → 레벨 무작위. 각 단계는 부족분만 채운다.
 *
 * 세 단계를 다 거쳐도 count 를 못 채우면 채운 만큼만 반환한다(예외 없음).
 * 읽기 문항이 세션을 지탱하므로 여기서 503 을 낼 이유가 없다.
 *
 * **유형 간 단어 중복 배제는 여기서 하지 않는다.** 리스닝이 읽기보다 먼저 뽑히므로
 * (읽기 문항 수가 count - 뽑힌리스닝수 로 정해진다) 이 시점에 세션 읽기 단어가 없다.
 * 배제는 반대 방향에서 건다 — daily 라우트가 읽기 후보를 deduplicateByContent 에
 * 리스닝 단어를 seed 로 넣어 거른다. 여기서 읽기 단어를 받으려 하면 순환이 된다.
 *
 * excludedWords 는 호출부가 추가로 막고 싶은 단어를 넣는 자리다(현재 라우트는 쓰지 않는다).
 */
export function selectListeningWords(params: {
  due: readonly ListeningCandidate[];
  enrolled: readonly ListeningCandidate[];
  random: readonly ListeningCandidate[];
  excludedWords?: readonly string[];
  count: number;
}): ListeningCandidate[] {
  const { due, enrolled, random, excludedWords = [], count } = params;

  if (count <= 0) {
    return [];
  }

  // 배제 단어와 "이미 뽑힌 단어"를 한 Set 이 함께 막는다 — 단계 간 중복도 이걸로 걸러진다.
  const blocked = new Set(excludedWords.map(normalizeWord));
  const picked: ListeningCandidate[] = [];

  for (const stage of [due, enrolled, random]) {
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

/**
 * 오답 보기 조합 — 정답 1 + 같은 레벨 오답 3, 셔플.
 *
 * 제외 규칙 셋: 정답 단어 자신 · coreMeaning 이 정답과 같은 것(유의어 충돌) ·
 * 같은 세션의 다른 문항에서 이미 쓰인 뜻.
 *
 * 오답을 3개 못 채우면 그 문항은 내지 않는다 — 보기가 넷이 아닌 문항은
 * 다른 문항과 난이도가 달라지고, 채점·XP 규칙이 문항마다 갈릴 이유가 없다.
 *
 * shuffle 을 주입 가능하게 둔 것은 테스트에서 순서를 고정하기 위해서다(진단·퀴즈 라우트 관례).
 */
export function buildListeningQuestions(params: {
  answers: readonly ListeningCandidate[];
  pool: readonly ListeningCandidate[];
  shuffle?: <T>(items: T[]) => T[];
}): ListeningDraft[] {
  const { answers, pool, shuffle = shuffleArray } = params;

  const usedMeanings = new Set<string>();
  const drafts: ListeningDraft[] = [];

  for (const answer of answers) {
    const answerCore = coreMeaning(answer.meaning);
    const distractors: ListeningCandidate[] = [];
    const takenCores = new Set<string>([answerCore]);

    for (const candidate of shuffle([...pool])) {
      if (distractors.length >= DISTRACTOR_COUNT) {
        break;
      }

      if (candidate.id === answer.id) {
        continue;
      }

      const core = coreMeaning(candidate.meaning);
      if (takenCores.has(core) || usedMeanings.has(core)) {
        continue;
      }

      takenCores.add(core);
      distractors.push(candidate);
    }

    if (distractors.length < DISTRACTOR_COUNT) {
      continue;
    }

    for (const core of takenCores) {
      usedMeanings.add(core);
    }

    drafts.push({
      id: answer.id,
      audioUrl: answer.audioUrl,
      options: shuffle([answer, ...distractors]).map((candidate) => ({
        text: candidate.meaning,
      })),
    });
  }

  return drafts;
}
