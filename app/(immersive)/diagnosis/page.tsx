import { DiagnosisTest } from "@/features/diagnosis";
import { allowGuestOrPreventRetake } from "@/shared/lib/diagnosis-guards";

export default async function DiagnosisPage() {
  // 게스트는 통과(null), 인증 사용자는 재진단 쿨다운 체크(완료 시 자동 리다이렉트).
  const session = await allowGuestOrPreventRetake();

  return <DiagnosisTest isAuthenticated={Boolean(session?.user?.id)} />;
}
