import { Flame } from "lucide-react";

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
      <div className="tactile-chip border-chamber-line bg-chamber-panel text-chamber-ink">
        <span className="text-cobalt-lt">LEVEL</span> {level}
      </div>
      {streak > 0 && (
        <div className="tactile-chip border-chamber-line bg-chamber-panel text-chamber-ink">
          <Flame className="h-3.5 w-3.5 text-coral" aria-hidden />
          {streak}일 연속
        </div>
      )}
    </>
  );
}

export function MobileUserStatusBadges({ level, streak }: UserStatusBadgesProps) {
  const streakLabel = getMobileStreakLabel(streak);

  return (
    <div className="mb-4 grid grid-cols-2 gap-2">
      <div className="rounded-xl border border-chamber-line bg-chamber-panel-hi px-3 py-2 text-center text-sm font-bold text-chamber-ink">
        <span className="text-cobalt-lt">LEVEL</span> {level}
      </div>
      <div className="flex items-center justify-center gap-1.5 rounded-xl border border-chamber-line bg-chamber-panel-hi px-3 py-2 text-center text-sm font-bold text-chamber-ink">
        <Flame className="h-3.5 w-3.5 text-coral" aria-hidden />
        {streakLabel}
      </div>
    </div>
  );
}
