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
      <div className="rounded-full border border-purple-100 bg-white/90 px-3 py-1.5 text-sm font-semibold text-purple-800">
        LEVEL {level}
      </div>
      {streak > 0 && (
        <div className="rounded-full border border-purple-100 bg-white/90 px-3 py-1.5 text-sm font-semibold text-purple-800">
          {streak}일 연속 학습
        </div>
      )}
    </>
  );
}

export function MobileUserStatusBadges({ level, streak }: UserStatusBadgesProps) {
  const streakLabel = getMobileStreakLabel(streak);

  return (
    <div className="mb-4 grid grid-cols-2 gap-2">
      <div className="rounded-xl border border-purple-100 bg-purple-50 px-3 py-2 text-center text-sm font-semibold text-purple-800">
        LEVEL {level}
      </div>
      <div className="rounded-xl border border-purple-100 bg-purple-50 px-3 py-2 text-center text-sm font-semibold text-purple-800">
        {streakLabel}
      </div>
    </div>
  );
}

