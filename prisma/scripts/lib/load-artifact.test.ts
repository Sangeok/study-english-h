// @vitest-environment node
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, it, expect } from "vitest";
import {
  invalidateArtifact,
  loadArtifact,
  parseArtifact,
  QUIZ_ARTIFACT,
} from "./load-artifact";

describe("parseArtifact", () => {
  it("비어 있지 않은 JSON 배열은 그대로 반환", () => {
    const records = parseArtifact<{ id: number }>('[{"id":1},{"id":2}]', "test.json");
    expect(records).toEqual([{ id: 1 }, { id: 2 }]);
  });

  it("JSON 이 아니면 hard fail", () => {
    expect(() => parseArtifact("not json", "test.json")).toThrow(/JSON 아님/);
  });

  it("배열이 아니면 hard fail", () => {
    expect(() => parseArtifact('{"a":1}', "test.json")).toThrow(/배열 아님/);
  });

  it("빈 배열은 hard fail(seed 는 항상 레코드를 기대)", () => {
    expect(() => parseArtifact("[]", "test.json")).toThrow(/비어 있음/);
  });
});

describe("loadArtifact", () => {
  it("artifact 부재 시 재생성 명령과 함께 즉시 실패(fail-fast)", () => {
    // 존재하지 않는 root → build 산출물 없음
    expect(() => loadArtifact("/no/such/root/__nonexistent__", QUIZ_ARTIFACT)).toThrow(
      QUIZ_ARTIFACT.buildCommand
    );
  });
});

describe("invalidateArtifact", () => {
  it("이전 artifact가 있으면 제거하고 다시 호출해도 실패하지 않는다", () => {
    const root = mkdtempSync(path.join(tmpdir(), "study-eng-artifact-"));
    const artifactPath = path.join(root, QUIZ_ARTIFACT.relPath);
    mkdirSync(path.dirname(artifactPath), { recursive: true });
    writeFileSync(artifactPath, "stale", "utf8");

    try {
      invalidateArtifact(root, QUIZ_ARTIFACT);
      invalidateArtifact(root, QUIZ_ARTIFACT);

      expect(existsSync(artifactPath)).toBe(false);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
