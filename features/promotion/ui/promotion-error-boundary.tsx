"use client";

import { Component, type ReactNode } from "react";
import { tactileButtonClass } from "@/shared/ui";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * 렌더 예외 경계 — features/quiz 의 QuizErrorBoundary 미러.
 * 페이지가 이 경계를 쓰지 않으면 예외 시 빈 화면이 된다.
 * QuizErrorBoundary 는 features/quiz 소유라 사이드웨이 임포트하지 않는다.
 */
export class PromotionErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  handleReset = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="mx-auto max-w-xl px-6 py-16 text-center">
          <h1 className="font-display text-2xl font-bold text-ink">
            시험 화면을 불러오지 못했어요
          </h1>
          <p className="mt-3 text-sm text-ink-soft">
            잠시 후 다시 시도해 주세요. 이번 응시는 채점되지 않았어요.
          </p>
          <button
            onClick={this.handleReset}
            className={tactileButtonClass("teal", "lg", { className: "mt-8" })}
          >
            다시 시도
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
