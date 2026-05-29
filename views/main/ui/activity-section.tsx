import { RecentActivity } from "@/widgets/recent-activity";
import { SectionWrapper } from "./section-wrapper";

interface ActivitySectionProps {
  diagnosisCompleted: boolean;
  hasCompletedTodayQuiz: boolean;
  isLoading: boolean;
  onQuizClick: () => void;
  onChallengeClick: () => void;
}

function getQuizButtonLabel(diagnosisCompleted: boolean, hasCompletedTodayQuiz: boolean): string {
  if (!diagnosisCompleted) return "진단 먼저 완료하기";
  if (hasCompletedTodayQuiz) return "추가 연습하기";
  return "퀴즈 시작하기";
}

export function ActivitySection({
  diagnosisCompleted,
  hasCompletedTodayQuiz,
  isLoading,
  onQuizClick,
  onChallengeClick
}: ActivitySectionProps) {
  const quizButtonLabel = getQuizButtonLabel(diagnosisCompleted, hasCompletedTodayQuiz);
  return (
    <SectionWrapper aria-label="학습 활동">
      <h3 className="text-3xl md:text-4xl font-display font-bold text-ink mb-8">
          이어서 학습하기
        </h3>

        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Continue Learning Card */}
          <div className="tactile-card tactile-card--raised p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="tactile-tile w-20 h-20 bg-teal border-teal-edge text-3xl shrink-0">
                <span>📖</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-teal-edge mb-1">일일 학습</p>
                <h4 className="font-display font-bold text-xl text-ink flex items-center flex-wrap gap-2">
                  오늘의 퀴즈
                  {hasCompletedTodayQuiz && (
                    <span className="tactile-chip border-teal bg-teal-tint text-teal-edge text-xs">
                      ✅ 완료
                    </span>
                  )}
                </h4>
                <p className="text-sm text-ink-soft mt-1">레벨에 맞는 문제로 실력 향상</p>
              </div>
            </div>
            <button
              onClick={onQuizClick}
              disabled={!diagnosisCompleted}
              className="tactile-btn tactile-btn--teal tactile-btn--block tactile-btn--lg"
            >
              {quizButtonLabel}
            </button>
          </div>

          {/* Challenge of the Day (Coming Soon) */}
          <div
            onClick={onChallengeClick}
            className="relative overflow-hidden rounded-[24px] border-2 border-grape-edge bg-grape p-8 text-white cursor-pointer transition-transform duration-300 hover:-translate-y-1"
            style={{ boxShadow: "0 6px 0 0 var(--grape-edge), 0 24px 40px -24px rgba(127,94,232,0.6)" }}
          >
            <div className="tactile-chip absolute top-4 right-4 border-white/30 bg-white/20 text-white">
              준비 중
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12" />

            <div className="relative z-10">
              <div className="inline-block px-3 py-1 bg-white/20 rounded-full mb-4 border-2 border-white/25">
                <span className="text-xs font-bold">오늘의 챌린지</span>
              </div>
              <h4 className="font-display font-bold text-2xl mb-3">데일리 챌린지</h4>
              <p className="opacity-90 mb-6">매일 새로운 학습 목표와 도전 과제가 제공될 예정입니다</p>

              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">💎</span>
                  <span className="font-semibold">보상 제공 예정</span>
                </div>
              </div>

              <button className="tactile-btn tactile-btn--ghost tactile-btn--block">
                곧 제공 예정
              </button>
            </div>
          </div>
        </div>

      {/* Recent Activity Section */}
      {diagnosisCompleted && !isLoading && (
        <div className="mt-8">
          <RecentActivity limit={7} />
        </div>
      )}
    </SectionWrapper>
  );
}
