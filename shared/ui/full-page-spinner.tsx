interface FullPageSpinnerProps {
  message?: string;
  /** paper = 셸(라이트) 화면, chamber = 몰입(다크) 화면 */
  variant?: "paper" | "chamber";
}

export function FullPageSpinner({ message = "로딩 중...", variant = "paper" }: FullPageSpinnerProps) {
  const isChamber = variant === "chamber";

  return (
    <div
      className={
        isChamber
          ? "min-h-screen flex items-center justify-center bg-chamber"
          : "min-h-screen flex items-center justify-center bg-cream-canvas"
      }
    >
      <div className="text-center space-y-5">
        <div className="relative mx-auto w-16 h-16">
          <div
            className={
              isChamber
                ? "absolute inset-0 rounded-full border-4 border-chamber-line"
                : "absolute inset-0 rounded-full border-4 border-border-warm"
            }
          />
          <div
            className={
              isChamber
                ? "absolute inset-0 rounded-full border-4 border-cobalt-lt border-t-transparent animate-spin"
                : "absolute inset-0 rounded-full border-4 border-teal border-t-transparent animate-spin"
            }
          />
        </div>
        <p
          className={
            isChamber
              ? "font-display font-semibold text-chamber-soft"
              : "font-display font-semibold text-ink-soft"
          }
        >
          {message}
        </p>
      </div>
    </div>
  );
}
