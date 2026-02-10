import { RecentActivity } from "@/widgets/recent-activity";
import { SectionWrapper } from "./section-wrapper";

interface ActivitySectionProps {
  diagnosisCompleted: boolean;
  isLoading: boolean;
  onQuizClick: () => void;
  onChallengeClick: () => void;
}

export function ActivitySection({
  diagnosisCompleted,
  isLoading,
  onQuizClick,
  onChallengeClick
}: ActivitySectionProps) {
  return (
    <SectionWrapper aria-label="학습 활동">
      <h3 className="text-3xl md:text-4xl font-display font-bold text-purple-950 mb-8">
          이어서 학습하기
        </h3>

        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Continue Learning Card */}
          <div className="bg-white rounded-3xl p-8 shadow-md border border-purple-100">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-3xl">📖</span>
              </div>
              <div className="flex-1">
                <p className="text-sm text-purple-700 mb-1">일일 학습</p>
                <h4 className="font-display font-bold text-xl text-purple-950">오늘의 퀴즈</h4>
                <p className="text-sm text-purple-600 mt-1">레벨에 맞는 문제로 실력 향상</p>
              </div>
            </div>
            <button
              onClick={onQuizClick}
              disabled={!diagnosisCompleted}
              className="w-full py-4 bg-gradient-to-br from-purple-600 to-violet-600 text-white font-semibold rounded-2xl hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {diagnosisCompleted && "퀴즈 시작하기"}
              {!diagnosisCompleted && "진단 먼저 완료하기"}
            </button>
          </div>

          {/* Challenge of the Day (Coming Soon) */}
          <div
            onClick={onChallengeClick}
            className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-3xl p-8 shadow-md relative overflow-hidden cursor-pointer hover:shadow-2xl transition-shadow opacity-75"
          >
            <div className="absolute top-4 right-4 px-3 py-1 bg-white/30 backdrop-blur-sm text-xs font-semibold rounded-full">
              준비 중
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12" />

            <div className="relative z-10">
              <div className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full mb-4">
                <span className="text-xs font-semibold">오늘의 챌린지</span>
              </div>
              <h4 className="font-display font-bold text-2xl mb-3">데일리 챌린지</h4>
              <p className="opacity-90 mb-6">매일 새로운 학습 목표와 도전 과제가 제공될 예정입니다</p>

              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">💎</span>
                  <span className="font-semibold">보상 제공 예정</span>
                </div>
              </div>

              <button className="w-full py-4 bg-white text-indigo-600 font-semibold rounded-2xl hover:shadow-lg transition-shadow">
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
