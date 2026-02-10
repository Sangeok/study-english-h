import type { DiagnosisStatusResponse } from "@/features/diagnosis";
import { FeatureCard } from "@/shared/ui";
import { FEATURE_CARDS, type MainPageHandlers } from "../constants";
import { SectionWrapper } from "./section-wrapper";

interface QuickAccessSectionProps {
  diagnosisStatus: DiagnosisStatusResponse | undefined;
  diagnosisCompleted: boolean;
  handlers: MainPageHandlers;
}

export function QuickAccessSection({
  diagnosisStatus,
  diagnosisCompleted,
  handlers
}: QuickAccessSectionProps) {
  const context = { diagnosisStatus, diagnosisCompleted };

  return (
    <SectionWrapper aria-label="빠른 실행">
      <div className="flex items-end justify-between mb-8">
        <div>
          <h3 className="text-3xl md:text-4xl font-display font-bold text-purple-950 mb-2">
            빠른 실행
          </h3>
          <p className="text-purple-800/80">좋아하는 활동을 바로 시작하세요</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {FEATURE_CARDS.map(card => {
          const onClick = card.handlerKey === "handleComingSoon"
            ? () => handlers.handleComingSoon(card.featureName)
            : handlers[card.handlerKey];

          return (
            <FeatureCard
              key={card.id}
              icon={card.icon}
              title={card.title}
              description={card.getDescription(context)}
              actionLabel={card.getActionLabel(context)}
              status={card.getStatus(context)}
              statusIcon={card.getStatusIcon?.(context)}
              badge={card.getBadge?.()}
              onClick={onClick}
            />
          );
        })}
      </div>
    </SectionWrapper>
  );
}
