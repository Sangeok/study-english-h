import { DiagnosisTest } from "@/features/diagnosis";
import { allowGuestOrPreventRetake } from "@/shared/lib/diagnosis-guards";

export default async function DiagnosisPage() {
  // 게스트는 통과, 인증 사용자는 재진단 쿨다운 체크(완료 시 자동 리다이렉트).
  // isAuthenticated 스레딩은 Phase 2(게스트 클라이언트 분기)에서 추가.
  await allowGuestOrPreventRetake();

  return <DiagnosisTest />;
}
