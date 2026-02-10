import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/shared/ui";
import { ROUTES, QUERY_PARAMS } from "@/shared/constants";

/**
 * 진단 완료 후 리다이렉트 시 토스트 메시지 자동 표시
 *
 * @description
 * URL 쿼리 파라미터 `message=diagnosis_completed`를 감지하여
 * 사용자에게 진단 완료 안내 메시지를 표시합니다.
 *
 * @example
 * // 진단 페이지에서:
 * router.push("/?message=diagnosis_completed");
 *
 * // 메인 페이지에서 자동으로 토스트 표시
 */
export function useDiagnosisToast() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const toastShownRef = useRef(false);

  useEffect(() => {
    const message = searchParams?.get(QUERY_PARAMS.MESSAGE);

    if (message === QUERY_PARAMS.DIAGNOSIS_COMPLETED && !toastShownRef.current) {
      toast("진단은 이미 완료되었습니다. 퀴즈를 시작해보세요!");
      toastShownRef.current = true;

      // URL에서 쿼리 파라미터 제거
      router.replace(ROUTES.HOME);
    }
  }, [searchParams, router, toast]);
}
