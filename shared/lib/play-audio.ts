/**
 * 텍스트 발음 재생 단일 진입점.
 * audioUrl(R2 mp3)이 있으면 파일 재생, 없거나 실패하면 브라우저 speechSynthesis 폴백.
 * 반환: 재생을 시작했으면 true, 어떤 수단도 불가하면 false (호출부가 토스트 처리).
 */
export function playAudio(text: string, audioUrl?: string): boolean {
  if (audioUrl) {
    const audio = new Audio(audioUrl);
    void audio.play().catch(() => {
      // 파일 재생 실패(404 등) 시 폴백으로 한 번 더 시도
      speakWithBrowserTts(text);
    });
    return true;
  }
  return speakWithBrowserTts(text);
}

function speakWithBrowserTts(text: string): boolean {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    return false;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = 0.95;
  window.speechSynthesis.speak(utterance);
  return true;
}
