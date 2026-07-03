interface UserStatusBadgesProps {
  level: string;
  streak: number;
}

function getMobileStreakLabel(streak: number): string {
  if (streak > 0) {
    return `${streak}일 연속`;
  }

  return "연속 학습 0일";
}

export function DesktopUserStatusBadges({ level, streak }: UserStatusBadgesProps) {
  return (
    <>
      <div className="tactile-chip border-ocean bg-ocean-tint text-ink">
        <span className="text-ocean-edge">LEVEL</span> {level}
      </div>
      {streak > 0 && (
        <div className="tactile-chip border-coral bg-coral-tint text-ink">
          <span>🔥</span> {streak}일 연속
        </div>
      )}
    </>
  );
}

export function MobileUserStatusBadges({ level, streak }: UserStatusBadgesProps) {
  const streakLabel = getMobileStreakLabel(streak);

  return (
    <div className="mb-4 grid grid-cols-2 gap-2">
      <div className="rounded-xl border-2 border-ocean bg-ocean-tint px-3 py-2 text-center text-sm font-bold text-ink">
        LEVEL {level}
      </div>
      <div className="rounded-xl border-2 border-coral bg-coral-tint px-3 py-2 text-center text-sm font-bold text-ink">
        🔥 {streakLabel}
      </div>
    </div>
  );
}
