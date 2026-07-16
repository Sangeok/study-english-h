/**
 * 텍스트 발음 재생 단일 진입점.
 * audioUrl(R2 mp3)이 있으면 파일 재생, 없거나 실패하면 브라우저 speechSynthesis 폴백.
 * 반환: 재생을 시작했으면 true, 어떤 수단도 불가하면 false (호출부가 토스트 처리).
 */
export async function playAudio(
  text: string,
  audioUrl?: string
): Promise<boolean> {
  if (!audioUrl) {
    return speakWithBrowserTts(text);
  }

  try {
    const audio = new Audio(audioUrl);
    await audio.play();
    return true;
  } catch {
    return speakWithBrowserTts(text);
  }
}

function speakWithBrowserTts(text: string): boolean {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    return false;
  }

  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
    return true;
  } catch {
    return false;
  }
}
