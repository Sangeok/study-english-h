"use client";

import { cn } from "@/lib/utils";

interface AudioToggleProps {
  /** 긍정형이다 — **끄는** 것이 리스닝 제외다. */
  isListeningEnabled: boolean;
  onChange: (enabled: boolean) => void;
}

/**
 * 오디오 토글 — 표시 전용.
 *
 * `game/` 이 아니라 슬라이스 ui 루트에 둔다: `game/` 은 세션 *중* 렌더 컴포넌트 폴더인데
 * 이 토글은 페치 *전* 에 값을 정해야 한다. 상태의 소유·지속은 게이트가 맡는다.
 */
export function AudioToggle({ isListeningEnabled, onChange }: AudioToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={isListeningEnabled}
      onClick={() => onChange(!isListeningEnabled)}
      className="flex w-full items-center justify-between rounded-2xl border border-chamber-line bg-chamber-panel px-5 py-4 text-left transition-colors hover:border-cobalt-lt"
    >
      <span className="flex flex-col">
        <span className="text-base font-bold text-chamber-ink">듣기 문항 포함</span>
        <span className="mt-0.5 text-xs text-chamber-soft">
          소리를 켤 수 없는 곳이라면 꺼 두세요. 읽기 문항만 나와요.
        </span>
      </span>

      <span
        className={cn(
          "relative ml-4 h-7 w-12 flex-shrink-0 rounded-full transition-colors",
          isListeningEnabled ? "bg-cobalt-lt" : "bg-chamber-panel-hi"
        )}
      >
        <span
          className={cn(
            "absolute top-1 h-5 w-5 rounded-full bg-white transition-all",
            isListeningEnabled ? "left-6" : "left-1"
          )}
        />
      </span>
    </button>
  );
}
