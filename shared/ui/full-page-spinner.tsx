interface FullPageSpinnerProps {
  message?: string;
}

export function FullPageSpinner({ message = "로딩 중..." }: FullPageSpinnerProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  );
}
