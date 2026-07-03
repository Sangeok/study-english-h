import { tactileButtonClass } from "@/shared/ui";

interface AuthButtonsProps {
  onLogin: () => void;
}

export function DesktopAuthButtons({ onLogin }: AuthButtonsProps) {
  return (
    <>
      <button type="button" onClick={onLogin} className={tactileButtonClass("ghost", "sm")}>
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
        className={tactileButtonClass("ghost", "sm", { block: true })}
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
