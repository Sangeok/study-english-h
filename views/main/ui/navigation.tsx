import { cn } from "@/lib/utils";

interface NavigationProps {
  streak: number;
  isLoading: boolean;
}

export function Navigation({ streak, isLoading }: NavigationProps) {
  return (
    <nav className="relative z-10 px-6 py-6 md:px-12 lg:px-20" aria-label="메인 네비게이션">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-xl font-bold text-white">E</span>
          </div>
          <h1 className="text-2xl font-display font-bold text-purple-950">EnglishFlow</h1>
        </div>
        <div className="flex items-center gap-6">
          {!isLoading && streak > 0 && (
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-sm">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
              <span className="text-sm text-purple-900">{streak}일 연속 학습 🔥</span>
            </div>
          )}
          <button className="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center hover:shadow-lg transition-shadow">
            <span className="text-xl">👤</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
