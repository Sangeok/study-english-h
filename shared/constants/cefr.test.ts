import { describe, it, expect } from "vitest";
import { buildAdjacentPriority, CEFR_ORDER } from "./cefr";

describe("buildAdjacentPriority", () => {
  it("exact 레벨이 항상 첫 원소(exact-first)", () => {
    for (const level of CEFR_ORDER) {
      expect(buildAdjacentPriority(level)[0]).toBe(level);
    }
  });

  it("모든 CEFR 레벨을 정확히 한 번씩 포함(중복·누락 없음)", () => {
    const result = buildAdjacentPriority("B1");
    expect(result).toHaveLength(CEFR_ORDER.length);
    expect([...result].sort()).toEqual([...CEFR_ORDER].sort());
  });

  it("같은 거리에서는 인접 하위가 인접 상위보다 앞선다", () => {
    // B1(idx2): exact → A2(하위1) → B2(상위1) → A1(하위2) → C1(상위2) → C2(상위3)
    expect(buildAdjacentPriority("B1")).toEqual(["B1", "A2", "B2", "A1", "C1", "C2"]);
  });

  it("최하위 A1 은 상위로만 확장한다", () => {
    expect(buildAdjacentPriority("A1")).toEqual(["A1", "A2", "B1", "B2", "C1", "C2"]);
  });

  it("최상위 C2 는 하위로만 확장한다", () => {
    expect(buildAdjacentPriority("C2")).toEqual(["C2", "C1", "B2", "B1", "A2", "A1"]);
  });
});
