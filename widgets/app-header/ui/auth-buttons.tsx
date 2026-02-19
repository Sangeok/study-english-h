interface AuthButtonsProps {
  onLogin: () => void;
}

export function DesktopAuthButtons({ onLogin }: AuthButtonsProps) {
  return (
    <>
      <button
        type="button"
        onClick={onLogin}
        className="rounded-xl border border-purple-200 bg-white px-4 py-2 text-sm font-semibold text-purple-800 transition-colors hover:bg-purple-50"
      >
        로그인
      </button>
      <button
        type="button"
        onClick={onLogin}
        className="rounded-xl bg-gradient-to-br from-purple-600 to-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition-shadow hover:shadow-lg"
      >
        시작하기
      </button>
    </>
  );
}

export function MobileAuthButtons({ onLogin }: AuthButtonsProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <button
        type="button"
        onClick={onLogin}
        className="rounded-xl border border-purple-200 bg-white px-3 py-2 text-sm font-semibold text-purple-800"
      >
        로그인
      </button>
      <button
        type="button"
        onClick={onLogin}
        className="rounded-xl bg-gradient-to-br from-purple-600 to-violet-600 px-3 py-2 text-sm font-semibold text-white"
      >
        시작하기
      </button>
    </div>
  );
}

