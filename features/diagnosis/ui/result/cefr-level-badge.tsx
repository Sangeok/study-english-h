import { CircularProgress } from "../shared/circular-progress";
import { CEFR_INFO } from "../../constants";

interface CEFRLevelBadgeProps {
  cefrLevel: string;
  totalScore: number;
}

export function CEFRLevelBadge({ cefrLevel, totalScore }: CEFRLevelBadgeProps) {
  const info = CEFR_INFO[cefrLevel] ?? CEFR_INFO.A1;

  return (
    <div className="text-center mb-8">
      <CircularProgress
        percentage={totalScore}
        size="lg"
        className="mx-auto mb-6"
      >
        <div className="text-4xl font-display font-bold text-purple-950">
          {cefrLevel}
        </div>
        <div className="text-sm text-purple-600">{info.title}</div>
      </CircularProgress>

      <h2 className="text-2xl font-display font-bold text-purple-950 mb-2">
        {info.title}
      </h2>
      <p className="text-purple-700 mb-4">{info.description}</p>

      <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 rounded-full">
        <span className="text-sm font-medium text-purple-700">
          총점: {totalScore}점
        </span>
      </div>
    </div>
  );
}
