import { tactileButtonClass } from "@/shared/ui";

interface AuthButtonsProps {
  onLogin: () => void;
}

const GHOST_ON_CHAMBER = "border-chamber-line text-chamber-ink hover:border-chamber-soft";

export function DesktopAuthButtons({ onLogin }: AuthButtonsProps) {
  return (
    <>
      <button
        type="button"
        onClick={onLogin}
        className={tactileButtonClass("ghost", "sm", { className: GHOST_ON_CHAMBER })}
      >
        로그인
      </button>
      <button type="button" onClick={onLogin} className={tactileButtonClass("teal", "sm")}>
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
        className={tactileButtonClass("ghost", "sm", { block: true, className: GHOST_ON_CHAMBER })}
      >
        로그인
      </button>
      <button
        type="button"
        onClick={onLogin}
        className={tactileButtonClass("teal", "sm", { block: true })}
      >
        시작하기
      </button>
    </div>
  );
}
