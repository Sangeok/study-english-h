/**
 * generated artifact 로더 (콘텐츠 파이프라인 Phase 3).
 *
 * seed 스크립트가 source 를 직접 조합하는 대신 build 산출물(generated artifact)만 읽도록 하는 공용 로더.
 * artifact 는 gitignore 되어 있어(로컬·CI 전용) 커밋되지 않는다 — 부재 시 즉시 실패시키고
 * 재생성 명령을 안내한다(fail-fast). silent skip 없이 "어떤 입력이 어떤 DB 를 만들었는가"를 artifact 로 고정한다.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

export interface ArtifactRef {
  /** repo root 기준 상대 경로 */
  relPath: string;
  /** 부재 시 안내할 재생성 명령 */
  buildCommand: string;
}

/** build 산출물 위치(build-*-artifact.ts 의 출력 경로와 일치해야 한다). */
export const QUIZ_ARTIFACT: ArtifactRef = {
  relPath: "prisma/data/generated/quiz-questions.generated.json",
  buildCommand: "npm run content:build:quiz",
};

export const VOCAB_ARTIFACT: ArtifactRef = {
  relPath: "prisma/data/generated/vocabularies.generated.json",
  buildCommand: "npm run content:build:vocabulary",
};

/**
 * generated artifact(JSON 배열)를 읽는다. 부재 시 재생성 명령과 함께 즉시 throw(fail-fast).
 * 경로만 받는 순수 함수 — import(테스트) 시 부작용이 없다.
 */
export function loadArtifact<T>(root: string, ref: ArtifactRef): T[] {
  const absPath = path.join(root, ref.relPath);
  if (!existsSync(absPath)) {
    throw new Error(
      `generated artifact 없음: ${ref.relPath}\n   먼저 실행하세요: ${ref.buildCommand}`
    );
  }
  return parseArtifact<T>(readFileSync(absPath, "utf8"), ref.relPath);
}

/**
 * 순수 파싱 — raw JSON 문자열을 비어 있지 않은 배열로 검증한다(테스트 대상).
 * JSON 아님·배열 아님·빈 배열은 모두 hard fail(seed 는 항상 레코드를 기대한다).
 */
export function parseArtifact<T>(rawText: string, label: string): T[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    throw new Error(`generated artifact 파싱 실패(JSON 아님): ${label}`);
  }
  if (!Array.isArray(parsed)) {
    throw new Error(`generated artifact 형식 오류(배열 아님): ${label}`);
  }
  if (parsed.length === 0) {
    throw new Error(`generated artifact 비어 있음: ${label} — build 재실행 필요`);
  }
  return parsed as T[];
}
