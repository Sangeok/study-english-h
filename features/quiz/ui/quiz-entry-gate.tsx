"use client";

import { useState, useSyncExternalStore } from "react";
import { QuizContainer } from "./quiz-container";
import { AudioToggle } from "./audio-toggle";
import { readQuizSession, type QuizSessionSnapshot } from "../lib/quiz-session-storage";

const STORAGE_KEY = "quiz-listening-enabled";

/**
 * 지속값 저장소.
 *
 * **`useState` 초기화자로 localStorage 를 읽으면 안 된다.** quiz/page.tsx 는 서버 컴포넌트라
 * 그 아래 클라이언트 컴포넌트도 초기 HTML 이 서버에서 렌더된다 — 서버는 기본값(true),
 * 클라이언트는 저장값(false)을 그려 토글이 켜졌다 꺼지는 하이드레이션 불일치가 난다.
 * `use-quiz-answers` 의 `typeof window` 가드는 선례가 아니다: 그쪽은 복원 대상이 답안 맵이라
 * 이미 같은 불일치를 안고 있다(따라 쓸 패턴이 아니라 기존 부채다).
 *
 * 표준 우회책(useEffect 로 마운트 후 setState)도 `react-hooks/set-state-in-effect` 가 막는다.
 * `useSyncExternalStore` 는 getServerSnapshot 이 SSR 스냅샷을 명시적으로 책임지므로
 * 불일치가 발생하지 않고 린트도 통과한다. 이 리포의 첫 사용례다.
 */
const listeners = new Set<() => void>();

function readStoredListening(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) !== "0";
  } catch {
    return true;
  }
}

function subscribe(onStoreChange: () => void): () => void {
  listeners.add(onStoreChange);
  // storage 이벤트는 *다른* 탭의 변경만 알린다. 같은 탭의 쓰기는 listeners 가 직접 깨운다.
  window.addEventListener("storage", onStoreChange);

  return () => {
    listeners.delete(onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

function writeStoredListening(enabled: boolean): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, enabled ? "1" : "0");
  } catch {
    // 시크릿 모드 등에서 저장 실패 — 이번 세션에만 반영된다.
  }

  for (const listener of listeners) {
    listener();
  }
}

/**
 * 오디오 토글의 마운트 지점.
 *
 * QuizContainer 는 첫 훅으로 useDailyQuiz(= useSuspenseQuery)를 호출해 **마운트 즉시 서스펜드**
 * 하므로, 컨테이너 안에서는 페치 전에 토글을 물을 수 없다. 게이트가 값을 먼저 정하고
 * 컨테이너를 렌더한다 — 쿼리 키가 확정된 값으로 만들어진다.
 *
 * **컨테이너는 "시작"을 누른 다음에야 렌더한다.** 동시에 렌더하면 세션 중 토글을 건드릴 수 있고,
 * 그 순간 쿼리 키(quiz.daily(listening))가 바뀌어 문항 전체가 새로 페치되고 진행 중인 답안이
 * 고아가 된다. 컨테이너가 선 뒤로 토글은 화면에 없다.
 */
export function QuizEntryGate() {
  const isListeningEnabled = useSyncExternalStore(
    subscribe,
    readStoredListening,
    () => true // 서버 스냅샷 — 기본은 "듣기 포함"
  );
  const [started, setStarted] = useState(false);
  const [restoredSession, setRestoredSession] = useState<QuizSessionSnapshot | null>(null);

  /**
   * 진행 중 세션은 **여기서, 클릭 시점에 한 번만** 읽는다.
   *
   * 렌더 중에 읽으면 위 주석이 경고하는 하이드레이션 불일치가 그대로 재현되고,
   * useSyncExternalStore 로 감싸려면 매 호출마다 새 객체를 만들지 않도록 캐시를 따로 들어야 한다.
   * 클릭 핸들러는 서버에서 실행되지 않으므로 둘 다 피한다.
   */
  function handleStart() {
    const result = readQuizSession();
    setRestoredSession(result.status === "ready" ? result.session : null);
    setStarted(true);
  }

  if (started) {
    return (
      <QuizContainer
        // 복원본이 있으면 그쪽 값이 이긴다 — 진행 중 세션의 문항 구성은 바꿀 수 없다.
        //   토글 변경은 다음 퀴즈부터 반영된다.
        listeningEnabled={restoredSession?.listeningEnabled ?? isListeningEnabled}
        restoredSession={restoredSession}
      />
    );
  }

  return (
    <div className="flex min-h-screen flex-col justify-center bg-chamber px-6 py-12">
      <div className="mx-auto w-full max-w-md">
        <p className="font-display text-sm font-semibold uppercase tracking-[0.3em] text-chamber-soft">
          Daily Quiz
        </p>
        <h1 className="mt-2 font-display text-3xl font-extrabold text-chamber-ink">
          오늘의 퀴즈
        </h1>
        <p className="mt-2 text-sm text-chamber-soft">
          읽기와 듣기를 섞어 10문항을 풀어요.
        </p>

        <div className="mt-8">
          <AudioToggle
            isListeningEnabled={isListeningEnabled}
            onChange={writeStoredListening}
          />
        </div>

        <button
          onClick={handleStart}
          className="tactile-btn tactile-btn--block tactile-btn--lg mt-6 bg-cobalt-lt text-white"
        >
          시작하기
        </button>
      </div>
    </div>
  );
}
