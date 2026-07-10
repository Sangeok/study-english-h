"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/shared/ui";
import { queryKeys } from "@/shared/lib";
import { fetchDiagnosisStatus, submitDiagnosis } from "../api/diagnosis-api";
import {
  readGuestDiagnosis,
  clearGuestDiagnosis,
} from "../lib/guest-diagnosis-storage";

/**
 * 가입 직후 게스트 진단 결과를 실제 계정으로 이관한다.
 * sessionStorage에 게스트 답변이 있고 계정에 진단 이력이 없을 때만 기존 submit으로 재전송(재채점·저장).
 *
 * @param isAuthenticated 서버에서 파생된 인증 상태. OAuth 복귀 후 홈(/) 서버 렌더 시 이미 true로
 *   도달하므로 better-auth 클라이언트 세션 하이드레이션 레이스가 없다. 값 변화 대비 deps에 둔다.
 */
export function useGuestDiagnosisMigration(isAuthenticated: boolean) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  // 단일 실행 보장(React 19 이펙트 이중 호출·리렌더·deps 변화 대비)
  const migratedRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (migratedRef.current) return;
    const guest = readGuestDiagnosis();
    if (!guest) return;
    migratedRef.current = true; // async 시작 전 set: 재진입 이중 발사 차단

    (async () => {
      try {
        const status = await fetchDiagnosisStatus();
        if (status.hasCompleted) {
          // 기존 진단 이력 존재 → 덮어쓰기 방지, 게스트 결과 조용히 폐기
          clearGuestDiagnosis();
          return;
        }
        // 캐시된 20문항 답변을 그대로 재전송 — 서버가 재채점해 LevelDiagnosis·UserProfile.level 생성
        await submitDiagnosis({ answers: guest.answers });
        clearGuestDiagnosis();
        // 서버 렌더(헤더 레벨)·클라 쿼리(홈 진단 상태·프로필) 최신화
        await queryClient.invalidateQueries({ queryKey: queryKeys.diagnosis.all });
        await queryClient.invalidateQueries({ queryKey: queryKeys.profile.all });
        router.refresh();
        toast("진단 결과가 계정에 저장됐어요. 딱 맞는 레벨에서 시작해요!", {
          variant: "success",
        });
      } catch {
        // 실패 시 재시도 허용(sessionStorage 유지) — 다음 마운트에서 재시도
        migratedRef.current = false;
      }
    })();
  }, [isAuthenticated, queryClient, router, toast]);
}
