import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { WeaknessAreasList } from "./weakness-areas-list";

const FEEDBACK_CASES = [
  { accuracy: 39, expectedFeedback: "가장 먼저 보완할 영역" },
  { accuracy: 40, expectedFeedback: "집중 학습 권장" },
  { accuracy: 59, expectedFeedback: "집중 학습 권장" },
] as const;

const DUPLICATED_FEEDBACK = [
  "우선 우선순위 높은 약점",
  "집중 집중 학습 권장",
] as const;

function renderWeaknessArea(accuracy: number): HTMLDivElement {
  const container = document.createElement("div");
  container.innerHTML = renderToStaticMarkup(
    <WeaknessAreasList
      weaknessAreas={[{ category: "문법", accuracy }]}
    />
  );
  return container;
}

describe("WeaknessAreasList", () => {
  it.each(FEEDBACK_CASES)(
    "$accuracy% 정확도에서 중복 없이 '$expectedFeedback'을 표시한다",
    ({ accuracy, expectedFeedback }) => {
      const container = renderWeaknessArea(accuracy);

      const feedbackText = (
        container.querySelector("p")?.textContent ?? ""
      ).trim();
      const renderedText = container.textContent ?? "";

      expect(feedbackText).toBe(expectedFeedback);
      for (const duplicatedFeedback of DUPLICATED_FEEDBACK) {
        expect(renderedText).not.toContain(duplicatedFeedback);
      }
    }
  );

  it("60% 정확도에서는 약점 피드백을 표시하지 않는다", () => {
    const container = renderWeaknessArea(60);

    const feedback = container.querySelector("p");

    expect(feedback).toBeNull();
  });
});
