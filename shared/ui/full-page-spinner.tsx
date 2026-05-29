interface FullPageSpinnerProps {
  message?: string;
}

export function FullPageSpinner({ message = "로딩 중..." }: FullPageSpinnerProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-cream-canvas">
      <div className="text-center space-y-5">
        <div className="relative mx-auto w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-border-warm" />
          <div className="absolute inset-0 rounded-full border-4 border-teal border-t-transparent animate-spin" />
        </div>
        <p className="font-display font-semibold text-ink-soft">{message}</p>
      </div>
    </div>
  );
}
