import { describe, it, expect, vi, afterEach } from "vitest";
import { playAudio } from "./play-audio";

describe("playAudio", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("audioUrl이 있으면 Audio로 재생을 시작하고 true를 반환한다", () => {
    const play = vi.fn().mockResolvedValue(undefined);
    // new로 호출되므로 화살표가 아닌 일반 함수(생성자)로 목킹한다
    const AudioMock = vi.fn(function (this: { play: typeof play }) {
      this.play = play;
    });
    vi.stubGlobal("Audio", AudioMock);

    const result = playAudio("apple", "https://cdn.example/words/apple.mp3");

    // Tier A (no-computation): play-audio.ts의 `if (audioUrl) { ...; return true; }` 가드에서 직접 도출
    expect(result).toBe(true);
    expect(AudioMock).toHaveBeenCalledWith("https://cdn.example/words/apple.mp3");
    expect(play).toHaveBeenCalledOnce();
  });

  it("audioUrl이 없고 speechSynthesis가 있으면 폴백으로 발음하고 true를 반환한다", () => {
    const speak = vi.fn();
    vi.stubGlobal("speechSynthesis", { speak, cancel: vi.fn() });
    vi.stubGlobal("SpeechSynthesisUtterance", vi.fn(function () {}));

    const result = playAudio("apple", undefined);

    // Tier A (no-computation): speakWithBrowserTts 성공 경로 `return true` 에서 직접 도출
    expect(result).toBe(true);
    expect(speak).toHaveBeenCalledOnce();
  });

  it("audioUrl도 없고 speechSynthesis도 없으면 false를 반환한다", () => {
    vi.stubGlobal("speechSynthesis", undefined);

    const result = playAudio("apple", undefined);

    // Tier A (no-computation): `if (!window.speechSynthesis) return false;` 가드에서 직접 도출
    expect(result).toBe(false);
  });
});
