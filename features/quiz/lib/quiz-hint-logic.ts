function hasContextHint(contextHint?: string | null): boolean {
  return Boolean(contextHint);
}

export function getMaxHintLevel(contextHint?: string | null): 1 | 2 {
  if (hasContextHint(contextHint)) {
    return 2;
  }

  return 1;
}

export function shouldShowContextHint(hintLevel: 0 | 1 | 2, contextHint?: string | null): boolean {
  if (!hasContextHint(contextHint)) {
    return false;
  }

  return hintLevel >= 1;
}

export function shouldShowKoreanHint(hintLevel: 0 | 1 | 2, contextHint?: string | null): boolean {
  if (!hasContextHint(contextHint)) {
    return hintLevel >= 1;
  }

  return hintLevel >= 2;
}

export function canRequestMoreHints(hintLevel: 0 | 1 | 2, contextHint?: string | null): boolean {
  const maxHintLevel = getMaxHintLevel(contextHint);
  return hintLevel < maxHintLevel;
}

export function getHintButtonLabel(hintLevel: 0 | 1 | 2): string {
  if (hintLevel === 0) {
    return "힌트 보기";
  }

  return "전체 힌트 보기";
}

