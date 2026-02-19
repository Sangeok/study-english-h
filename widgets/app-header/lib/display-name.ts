const DEFAULT_DISPLAY_NAME = "Learner";

export function getDisplayName(userName?: string | null): string {
  if (!userName) {
    return DEFAULT_DISPLAY_NAME;
  }

  const trimmed = userName.trim();
  if (trimmed.length === 0) {
    return DEFAULT_DISPLAY_NAME;
  }

  return trimmed;
}

export function getInitial(userName?: string | null): string {
  const displayName = getDisplayName(userName);
  return displayName.charAt(0).toUpperCase();
}

