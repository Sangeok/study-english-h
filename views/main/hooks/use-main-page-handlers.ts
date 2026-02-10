import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/shared/ui";
import { ROUTES } from "@/shared/constants/routes";
import type { DiagnosisStatusResponse } from "@/features/diagnosis";

interface UseMainPageHandlersProps {
  diagnosisStatus: DiagnosisStatusResponse | undefined;
}

export function useMainPageHandlers({ diagnosisStatus }: UseMainPageHandlersProps) {
  const router = useRouter();
  const { toast } = useToast();

  const diagnosisCompleted = diagnosisStatus?.hasCompleted ?? false;

  const handleQuizClick = useCallback(() => {
    if (diagnosisCompleted) {
      router.push(ROUTES.QUIZ);
      return;
    }
    toast("레벨 진단을 먼저 완료해주세요!", { variant: "warning" });
    router.push(ROUTES.DIAGNOSIS);
  }, [diagnosisCompleted, router, toast]);

  const handleDiagnosisClick = useCallback(() => {
    if (!diagnosisCompleted) {
      router.push(ROUTES.DIAGNOSIS);
      return;
    }
    if (diagnosisStatus?.canRetake) {
      router.push(ROUTES.DIAGNOSIS);
      return;
    }
    const days = diagnosisStatus?.daysUntilRetake ?? 0;
    toast(`재진단은 ${days}일 후에 가능합니다. 현재는 퀴즈로 학습을 계속하세요!`);
  }, [diagnosisCompleted, diagnosisStatus, router, toast]);

  const handleFlashcardClick = useCallback(() => {
    router.push(ROUTES.FLASHCARD_MODES);
  }, [router]);

  const handleComingSoon = useCallback((feature?: string) => {
    if (feature) {
      toast(`${feature} 기능은 곧 제공될 예정입니다! 🚀`);
      return;
    }
    toast("이 기능은 곧 제공될 예정입니다! 🚀");
  }, [toast]);

  return { handleQuizClick, handleDiagnosisClick, handleFlashcardClick, handleComingSoon };
}
