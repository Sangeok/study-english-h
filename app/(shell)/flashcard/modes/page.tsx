/**
 * Study Mode Selection Page
 *
 * Displays available study modes for vocabulary learning
 */

"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface ModeCard {
  id: string;
  emoji: string;
  title: string;
  description: string;
  route: string;
  available: boolean;
}

const modes: ModeCard[] = [
  {
    id: "flashcard",
    emoji: "🃏",
    title: "플래시카드",
    description: "앞뒤로 넘기며 학습",
    route: "/flashcard?mode=review",
    available: true,
  },
  {
    id: "matching",
    emoji: "🔗",
    title: "매칭",
    description: "한글 뜻과 영어 단어 짝맞추기",
    route: "/flashcard/matching",
    available: false, // Phase 4
  },
  {
    id: "choice",
    emoji: "✅",
    title: "선택형",
    description: "4개 선택지에서 정답 선택",
    route: "/flashcard/choice",
    available: false, // Phase 4
  },
  {
    id: "typing",
    emoji: "⌨️",
    title: "타이핑",
    description: "영어 단어 직접 입력",
    route: "/flashcard/typing",
    available: false, // Phase 4
  },
  {
    id: "listening",
    emoji: "🎧",
    title: "리스닝",
    description: "영어 발음 듣고 선택",
    route: "/flashcard/listening",
    available: false, // Phase 4
  },
];

type ModeTone = "teal" | "coral" | "ocean" | "gold" | "grape";

// Decorative tone per mode tile (cycles through the palette).
const MODE_TONES: ModeTone[] = ["teal", "coral", "ocean", "gold", "grape"];

const tileTone: Record<ModeTone, string> = {
  teal: "border-teal bg-teal-tint",
  coral: "border-coral bg-coral-tint",
  ocean: "border-ocean bg-ocean-tint",
  gold: "border-gold bg-gold-tint",
  grape: "border-grape bg-grape-tint",
};

export default function ModesPage() {
  const router = useRouter();

  const handleModeClick = (mode: ModeCard) => {
    if (mode.available) {
      router.push(mode.route);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-cream-canvas px-4 py-12">
      <div className="pointer-events-none absolute -left-24 top-10 h-64 w-64 rounded-full bg-teal-tint blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -right-24 top-48 h-64 w-64 rounded-full bg-coral-tint blur-3xl" aria-hidden />

      <div className="relative mx-auto max-w-4xl space-y-8">
        {/* Header — solid coral hero block */}
        <div
          className="relative overflow-hidden rounded-[28px] border-2 border-coral-edge bg-coral p-8 text-white animate-[pop-in]"
          style={{ boxShadow: "0 6px 0 0 var(--coral-edge), 0 28px 44px -26px rgba(255,107,107,0.55)" }}
        >
          <div className="absolute -right-12 -top-12 h-52 w-52 rounded-full bg-white/10" aria-hidden />
          <span className="pointer-events-none absolute -bottom-6 right-6 select-none text-8xl opacity-20" aria-hidden>
            🎴
          </span>
          <div className="relative">
            <p className="font-display text-[11px] font-bold uppercase tracking-[0.3em] text-white/70">
              Study Modes
            </p>
            <h1 className="mt-2 font-display text-3xl font-bold md:text-4xl">학습 모드 선택</h1>
            <p className="mt-2 text-white/85">다양한 방식으로 단어를 학습하세요!</p>
          </div>
        </div>

        {/* Mode Grid */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {modes.map((mode, idx) => {
            const tone = MODE_TONES[idx % MODE_TONES.length];
            return (
              <button
                key={mode.id}
                onClick={() => handleModeClick(mode)}
                disabled={!mode.available}
                style={{ animationDelay: `${idx * 60}ms` }}
                className={cn(
                  "tactile-card relative p-7 text-left animate-[pop-in]",
                  mode.available
                    ? "tactile-card--interactive cursor-pointer"
                    : "cursor-not-allowed opacity-60"
                )}
              >
                {!mode.available && (
                  <div className="tactile-chip absolute right-4 top-4 border-grape bg-grape-tint text-[11px] font-bold text-ink">
                    준비 중
                  </div>
                )}

                <div className={cn("tactile-tile mb-4 h-16 w-16 text-3xl", tileTone[tone])}>
                  <span>{mode.emoji}</span>
                </div>
                <h3 className="font-display text-xl font-bold text-ink">{mode.title}</h3>
                <p className="mt-1 text-sm text-ink-soft">{mode.description}</p>
              </button>
            );
          })}
        </div>

        {/* Back Button */}
        <div className="pt-2 text-center">
          <button
            onClick={() => router.push("/")}
            className="tactile-btn tactile-btn--ghost tactile-btn--lg"
          >
            홈으로 돌아가기
          </button>
        </div>

        {/* Info Section */}
        <div className="tactile-card mx-auto max-w-2xl p-6">
          <div className="mb-3 flex items-center gap-3">
            <div className="tactile-tile h-11 w-11 border-gold bg-gold-tint text-xl">
              <span>💡</span>
            </div>
            <h3 className="font-display text-lg font-bold text-ink">학습 팁</h3>
          </div>
          <ul className="space-y-2 text-sm text-ink-soft">
            <li className="flex items-start gap-2">
              <span className="text-teal-edge">•</span>
              <span>매일 꾸준히 복습하면 장기 기억에 효과적입니다</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-teal-edge">•</span>
              <span>다양한 학습 모드를 번갈아 사용하면 더 재미있게 학습할 수 있습니다</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-teal-edge">•</span>
              <span>어려운 단어는 여러 번 반복하여 학습하세요</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
