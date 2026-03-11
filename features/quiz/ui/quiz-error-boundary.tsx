"use client";

import { Component, type ReactNode } from "react";
import { QuizError } from "./status/quiz-error";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class QuizErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  handleReset = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return <QuizError onRetry={this.handleReset} />;
    }
    return this.props.children;
  }
}
