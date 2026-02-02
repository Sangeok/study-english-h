"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiClient } from "@/shared/lib";

// 정적 배경 장식 요소
const BACKGROUND_DECORATIONS = [
  {
    className: "absolute top-20 -right-32 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl animate-float",
    style: { animationDuration: "20s" },
  },
  {
    className: "absolute bottom-20 -left-32 w-96 h-96 bg-violet-200/20 rounded-full blur-3xl animate-float",
    style: { animationDuration: "25s", animationDelay: "2s" },
  },
  {
    className: "absolute top-1/2 left-1/2 w-64 h-64 bg-indigo-200/20 rounded-full blur-3xl animate-float",
    style: { animationDuration: "30s", animationDelay: "4s" },
  },
] as const;

// 발음 점수 데이터
const PRONUNCIATION_SCORES = [92, 88, 95, 85, 90] as const;

export default function MainPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const heroRef = useRef<HTMLDivElement>(null);
  const [diagnosisCompleted, setDiagnosisCompleted] = useState<boolean | null>(null);

  useEffect(() => {
    // Add entrance animations on mount
    if (heroRef.current) {
      heroRef.current.classList.add("animate-fade-in");
    }

    // 진단 상태 로딩
    const loadDiagnosisStatus = async () => {
      try {
        const data = await apiClient.get<{ hasCompleted: boolean }>("/api/diagnosis/status");
        setDiagnosisCompleted(data.hasCompleted);
      } catch (error) {
        console.error("진단 상태 조회 실패:", error);
      }
    };

    loadDiagnosisStatus();

    // 리다이렉트 메시지 표시
    const message = searchParams?.get("message");
    if (message === "diagnosis_completed") {
      alert("진단은 이미 완료되었습니다. 퀴즈를 시작해보세요!");
    }
  }, [searchParams]);

  const handleQuizClick = () => {
    if (diagnosisCompleted === null) return; // 로딩 중

    if (!diagnosisCompleted) {
      const confirmed = confirm("퀴즈를 이용하려면 먼저 레벨 진단을 완료해야 합니다. 진단을 시작하시겠습니까?");
      if (confirmed) {
        router.push("/diagnosis");
      }
    } else {
      router.push("/quiz");
    }
  };

  const handleDiagnosisClick = () => {
    if (diagnosisCompleted === null) return; // 로딩 중

    if (diagnosisCompleted) {
      alert("진단은 이미 완료되었습니다. 퀴즈를 이용해보세요!");
    } else {
      router.push("/diagnosis");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-violet-50 to-indigo-50 overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {BACKGROUND_DECORATIONS.map((decoration, index) => (
          <div key={index} className={decoration.className} style={decoration.style} />
        ))}
      </div>

      {/* Navigation */}
      <nav className="relative z-10 px-6 py-6 md:px-12 lg:px-20">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-xl font-bold text-white">E</span>
            </div>
            <h1 className="text-2xl font-display font-bold text-purple-950">EnglishFlow</h1>
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-sm">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
              <span className="text-sm text-purple-900">7일 연속 학습 🔥</span>
            </div>
            <button className="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center hover:shadow-lg transition-shadow">
              <span className="text-xl">👤</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section ref={heroRef} className="relative z-10 px-6 pt-8 pb-16 md:px-12 lg:px-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Text Content */}
            <div className="space-y-6 animate-slide-in-left">
              <div className="inline-block px-4 py-2 bg-purple-100 rounded-full">
                <span className="text-sm font-medium text-purple-700">다시 오신 것을 환영합니다!</span>
              </div>
              <h2 className="text-5xl md:text-6xl lg:text-7xl font-display font-bold text-purple-950 leading-tight">
                영어 마스터하기,
                <br />
                <span className="bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
                  한 걸음씩
                </span>
                <br />
                함께해요
              </h2>
              <p className="text-lg md:text-xl text-purple-800/80 leading-relaxed max-w-lg">
                맞춤형 영어 학습 여정. 말하기 연습, 어휘 확장, 흥미로운 레슨으로 실력을 추적하세요.
              </p>
              <div className="flex flex-wrap gap-4 pt-4">
                <button className="px-8 py-4 bg-gradient-to-br from-purple-600 to-violet-600 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
                  학습 계속하기
                </button>
                <button className="px-8 py-4 bg-white text-purple-900 font-semibold rounded-2xl shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300">
                  진행상황 보기
                </button>
              </div>
            </div>

            {/* Right Column - Floating Cards */}
            <div className="relative h-96 lg:h-[500px] animate-slide-in-right">
              {/* Card 1 - Vocabulary */}
              <div
                className="absolute top-0 right-0 w-64 bg-white rounded-3xl shadow-xl p-6 border border-purple-100 hover:scale-105 transition-transform duration-300"
                style={{ transform: "rotate(5deg)" }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center">
                    <span className="text-2xl">📚</span>
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-purple-950">어휘</h3>
                    <p className="text-xs text-purple-700">245개 단어 마스터</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-purple-700">진행률</span>
                    <span className="font-semibold text-purple-600">68%</span>
                  </div>
                  <div className="h-2 bg-purple-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full"
                      style={{ width: "68%" }}
                    />
                  </div>
                </div>
              </div>

              {/* Card 2 - Speaking */}
              <div
                className="absolute top-32 left-0 w-64 bg-white rounded-3xl shadow-xl p-6 border border-violet-100 hover:scale-105 transition-transform duration-300"
                style={{ transform: "rotate(-3deg)" }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-violet-600 rounded-2xl flex items-center justify-center">
                    <span className="text-2xl">🎤</span>
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-purple-950">발음</h3>
                    <p className="text-xs text-purple-700">이번 주 12회 연습</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {PRONUNCIATION_SCORES.map((score, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full bg-violet-100 rounded-full overflow-hidden h-16">
                        <div
                          className="bg-gradient-to-t from-violet-500 to-violet-600 rounded-full transition-all duration-500"
                          style={{ height: `${score}%` }}
                        />
                      </div>
                      <span className="text-xs text-purple-700">{score}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card 3 - Daily Goal */}
              <div
                className="absolute bottom-0 right-8 w-56 bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-3xl shadow-xl p-6 hover:scale-105 transition-transform duration-300"
                style={{ transform: "rotate(-8deg)" }}
              >
                <div className="text-center space-y-3">
                  <div className="text-5xl">🎯</div>
                  <h3 className="font-display font-bold text-xl">오늘의 목표</h3>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-4xl font-bold">15</span>
                    <span className="text-sm opacity-90">/ 20분</span>
                  </div>
                  <p className="text-sm opacity-90">5분만 더 하면 완료!</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Access Features */}
      <section className="relative z-10 px-6 py-16 md:px-12 lg:px-20">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h3 className="text-3xl md:text-4xl font-display font-bold text-purple-950 mb-2">빠른 실행</h3>
              <p className="text-purple-800/80">좋아하는 활동을 바로 시작하세요</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature Card 1 - 진단 퀴즈 */}
            <div
              onClick={handleDiagnosisClick}
              className={`group bg-white rounded-3xl p-6 shadow-md transition-all duration-300 border ${
                diagnosisCompleted === null
                  ? "cursor-wait"
                  : diagnosisCompleted
                  ? "opacity-70 cursor-not-allowed bg-green-50 border-green-200"
                  : "hover:shadow-2xl border-transparent hover:border-purple-200 cursor-pointer"
              }`}
            >
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <span className="text-3xl">📝</span>
              </div>
              <h4 className="font-display font-bold text-xl text-purple-950 mb-2 flex items-center gap-2">
                진단 퀴즈
                {diagnosisCompleted && <span className="text-green-600">✓</span>}
              </h4>
              <p className="text-sm text-purple-700 mb-4">
                {diagnosisCompleted ? "진단이 완료되었습니다" : "현재 레벨을 평가하고 맞춤형 추천을 받아보세요"}
              </p>
              <div className="flex items-center gap-2 text-purple-600 font-semibold text-sm">
                <span>{diagnosisCompleted ? "완료됨" : "평가 시작하기"}</span>
                {!diagnosisCompleted && <span className="group-hover:translate-x-1 transition-transform">→</span>}
              </div>
            </div>

            {/* Feature Card 2 - 일일 퀴즈 */}
            <div
              onClick={handleQuizClick}
              className={`group bg-white rounded-3xl p-6 shadow-md transition-all duration-300 border ${
                diagnosisCompleted === null
                  ? "cursor-wait"
                  : !diagnosisCompleted
                  ? "opacity-50 cursor-not-allowed border-gray-200"
                  : "hover:shadow-2xl border-transparent hover:border-violet-200 cursor-pointer"
              }`}
            >
              <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-violet-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <span className="text-3xl">🎮</span>
              </div>
              <h4 className="font-display font-bold text-xl text-purple-950 mb-2 flex items-center gap-2">
                일일 퀴즈
                {!diagnosisCompleted && <span className="text-gray-400">🔒</span>}
              </h4>
              <p className="text-sm text-purple-700 mb-4">
                {diagnosisCompleted ? "맞춤형 퀴즈를 풀어보세요" : "진단 완료 후 이용 가능합니다"}
              </p>
              <div className="flex items-center gap-2 text-violet-600 font-semibold text-sm">
                <span>{diagnosisCompleted ? "지금 플레이" : "잠김"}</span>
                {diagnosisCompleted && <span className="group-hover:translate-x-1 transition-transform">→</span>}
              </div>
            </div>

            {/* Feature Card 3 */}
            <div className="group bg-white rounded-3xl p-6 shadow-md hover:shadow-2xl transition-all duration-300 border border-transparent hover:border-indigo-200 cursor-pointer">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <span className="text-3xl">🎧</span>
              </div>
              <h4 className="font-display font-bold text-xl text-purple-950 mb-2">듣기 연습</h4>
              <p className="text-sm text-purple-700 mb-4">원어민 오디오로 이해력을 향상시키세요</p>
              <div className="flex items-center gap-2 text-indigo-600 font-semibold text-sm">
                <span>듣기 시작하기</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </div>

            {/* Feature Card 4 */}
            <div className="group bg-gradient-to-br from-purple-600 to-violet-600 rounded-3xl p-6 shadow-md hover:shadow-2xl transition-all duration-300 cursor-pointer text-white">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <span className="text-3xl">🗣️</span>
              </div>
              <h4 className="font-display font-bold text-xl mb-2">스피킹 코치</h4>
              <p className="text-sm opacity-90 mb-4">AI 기반 실시간 발음 피드백</p>
              <div className="flex items-center gap-2 font-semibold text-sm">
                <span>말하기 연습</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Progress Dashboard Preview */}
      <section className="relative z-10 px-6 py-16 md:px-12 lg:px-20 bg-white/40 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h3 className="text-3xl md:text-4xl font-display font-bold text-purple-950 mb-2">학습 진행률</h3>
              <p className="text-purple-800/80">계속 화이팅!</p>
            </div>
            <button className="text-purple-600 font-semibold hover:text-purple-700 transition-colors">
              모든 통계 보기 →
            </button>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Stat Card 1 */}
            <div className="bg-white rounded-3xl p-8 shadow-md">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-sm text-purple-700 mb-1">총 경험치</p>
                  <p className="text-4xl font-display font-bold text-purple-950">2,847</p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center">
                  <span className="text-3xl">⭐</span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-purple-600">
                <span className="font-semibold">↑ 145 XP</span>
                <span className="text-purple-700">이번 주</span>
              </div>
            </div>

            {/* Stat Card 2 */}
            <div className="bg-white rounded-3xl p-8 shadow-md">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-sm text-purple-700 mb-1">연속 학습</p>
                  <p className="text-4xl font-display font-bold text-purple-950">7일</p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-violet-100 to-violet-200 rounded-2xl flex items-center justify-center">
                  <span className="text-3xl">🔥</span>
                </div>
              </div>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                  <div key={day} className="flex-1 h-2 bg-violet-500 rounded-full" />
                ))}
              </div>
            </div>

            {/* Stat Card 3 */}
            <div className="bg-white rounded-3xl p-8 shadow-md">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-sm text-purple-700 mb-1">업적</p>
                  <p className="text-4xl font-display font-bold text-purple-950">12/28</p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-2xl flex items-center justify-center">
                  <span className="text-3xl">🏆</span>
                </div>
              </div>
              <div className="flex -space-x-2">
                {["🎯", "📚", "🎤", "⚡"].map((emoji, i) => (
                  <div
                    key={i}
                    className="w-10 h-10 bg-white border-2 border-purple-100 rounded-full flex items-center justify-center shadow-sm"
                  >
                    <span>{emoji}</span>
                  </div>
                ))}
                <div className="w-10 h-10 bg-purple-50 border-2 border-purple-100 rounded-full flex items-center justify-center shadow-sm">
                  <span className="text-xs text-purple-700 font-semibold">+8</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Activity & Gamification */}
      <section className="relative z-10 px-6 py-16 md:px-12 lg:px-20">
        <div className="max-w-7xl mx-auto">
          <h3 className="text-3xl md:text-4xl font-display font-bold text-purple-950 mb-8">이어서 학습하기</h3>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Recent Lesson */}
            <div className="bg-white rounded-3xl p-8 shadow-md border border-purple-100">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-3xl">📖</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-purple-700 mb-1">레슨 14 - 비즈니스 영어</p>
                  <h4 className="font-display font-bold text-xl text-purple-950">직장 내 커뮤니케이션</h4>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex-1 h-2 bg-purple-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full"
                        style={{ width: "45%" }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-purple-600">45%</span>
                  </div>
                </div>
              </div>
              <button className="w-full py-4 bg-gradient-to-br from-purple-600 to-violet-600 text-white font-semibold rounded-2xl hover:shadow-lg transition-shadow">
                레슨 계속하기
              </button>
            </div>

            {/* Challenge of the Day */}
            <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-3xl p-8 shadow-md relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12" />

              <div className="relative z-10">
                <div className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full mb-4">
                  <span className="text-xs font-semibold">오늘의 챌린지</span>
                </div>
                <h4 className="font-display font-bold text-2xl mb-3">관용구 마스터 챌린지</h4>
                <p className="opacity-90 mb-6">일반적인 영어 관용구 5개를 배우고 문장으로 사용해보세요</p>

                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">💎</span>
                    <span className="font-semibold">+50 XP</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm opacity-90">
                    <span>⏱️</span>
                    <span>8시간 23분 후 종료</span>
                  </div>
                </div>

                <button className="w-full py-4 bg-white text-indigo-600 font-semibold rounded-2xl hover:shadow-lg transition-shadow">
                  챌린지 수락
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="relative z-10 px-6 py-16 md:px-12 lg:px-20">
        <div className="max-w-4xl mx-auto bg-gradient-to-br from-purple-600 to-violet-600 rounded-3xl p-12 text-center text-white shadow-2xl">
          <h3 className="text-3xl md:text-4xl font-display font-bold mb-4">레벨업 준비되셨나요?</h3>
          <p className="text-lg opacity-90 mb-8">프리미엄 기능을 잠금 해제하고 영어 학습 속도를 높이세요</p>
          <div className="flex flex-wrap justify-center gap-4">
            <button className="px-8 py-4 bg-white text-purple-600 font-semibold rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
              프리미엄 업그레이드
            </button>
            <button className="px-8 py-4 bg-white/20 backdrop-blur-sm text-white font-semibold rounded-2xl hover:bg-white/30 transition-all duration-300">
              자세히 알아보기
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
