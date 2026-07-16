import { afterEach, describe, expect, it, vi } from "vitest";

import { playAudio } from "./play-audio";

describe("playAudio", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("audioUrl이 있고 파일 재생이 성공하면 true를 반환한다", async () => {
    const play = vi.fn().mockResolvedValue(undefined);
    const AudioMock = vi.fn(function (this: { play: typeof play }) {
      this.play = play;
    });
    vi.stubGlobal("Audio", AudioMock);

    const result = await playAudio(
      "apple",
      "https://cdn.example/words/apple.mp3"
    );

    expect(result).toBe(true);
    expect(AudioMock).toHaveBeenCalledWith("https://cdn.example/words/apple.mp3");
    expect(play).toHaveBeenCalledOnce();
  });

  it("audioUrl이 없고 speechSynthesis가 있으면 폴백으로 발음하고 true를 반환한다", async () => {
    const speak = vi.fn();
    vi.stubGlobal("speechSynthesis", { speak, cancel: vi.fn() });
    vi.stubGlobal("SpeechSynthesisUtterance", vi.fn(function () {}));

    const result = await playAudio("apple", undefined);

    expect(result).toBe(true);
    expect(speak).toHaveBeenCalledOnce();
  });

  it("파일 재생이 실패하고 speechSynthesis가 있으면 폴백으로 발음하고 true를 반환한다", async () => {
    const play = vi.fn().mockRejectedValue(new Error("404"));
    const AudioMock = vi.fn(function (this: { play: typeof play }) {
      this.play = play;
    });
    const speak = vi.fn();
    const cancel = vi.fn();
    const SpeechSynthesisUtteranceMock = vi.fn(function () {});
    vi.stubGlobal("Audio", AudioMock);
    vi.stubGlobal("speechSynthesis", { speak, cancel });
    vi.stubGlobal(
      "SpeechSynthesisUtterance",
      SpeechSynthesisUtteranceMock
    );

    const result = await playAudio(
      "apple",
      "https://cdn.example/words/missing.mp3"
    );

    expect(result).toBe(true);
    expect(cancel).toHaveBeenCalledOnce();
    expect(SpeechSynthesisUtteranceMock).toHaveBeenCalledWith("apple");
    expect(speak).toHaveBeenCalledOnce();
  });

  it("파일 재생이 실패하고 speechSynthesis도 없으면 false를 반환한다", async () => {
    const play = vi.fn().mockRejectedValue(new Error("404"));
    const AudioMock = vi.fn(function (this: { play: typeof play }) {
      this.play = play;
    });
    vi.stubGlobal("Audio", AudioMock);
    vi.stubGlobal("speechSynthesis", undefined);

    const result = await playAudio(
      "apple",
      "https://cdn.example/words/missing.mp3"
    );

    expect(result).toBe(false);
  });

  it("audioUrl도 없고 speechSynthesis도 없으면 false를 반환한다", async () => {
    vi.stubGlobal("speechSynthesis", undefined);

    const result = await playAudio("apple", undefined);

    expect(result).toBe(false);

    vi.stubGlobal("speechSynthesis", {
      cancel: vi.fn(),
      speak: vi.fn(() => {
        throw new Error("speech synthesis failed");
      }),
    });
    vi.stubGlobal("SpeechSynthesisUtterance", vi.fn(function () {}));

    await expect(playAudio("apple", undefined)).resolves.toBe(false);
  });
});
