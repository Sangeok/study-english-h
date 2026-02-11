interface DiagnosisLoadingProps {
  title?: string;
  description?: string;
}

export function DiagnosisLoading({
  title = "문제 준비 중...",
  description = "잠시만 기다려주세요",
}: DiagnosisLoadingProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-violet-50 to-indigo-50 flex items-center justify-center">
      <div className="text-center">
        <div className="relative w-24 h-24 mx-auto mb-6">
          <div className="absolute inset-0 rounded-full border-4 border-purple-200" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-600 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-3xl">📝</span>
          </div>
        </div>
        <h2 className="text-2xl font-display font-bold text-purple-950 mb-2">
          {title}
        </h2>
        <p className="text-purple-700">{description}</p>
      </div>
    </div>
  );
}
