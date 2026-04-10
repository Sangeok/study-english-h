import { useCallback } from "react";
import { useToast } from "@/shared/ui/toast";
import { ACHIEVEMENTS } from "../config/achievements";
import type { GamificationResult } from "../types";

/**
 * gamification 결과를 토스트 메시지로 변환하여 표시하는 유틸 훅.
 *
 * 토스트 우선순위: 승급 > 마일스톤 > 리그 포인트 > 업적
 * toast 시스템의 MAX_TOASTS=3 제한을 고려하여 가장 중요한 알림 우선 표시.
 */
export function useRewardToast() {
  const { toast } = useToast();

  const showRewards = useCallback((result: GamificationResult) => {
    // 역순 발사: toast 시스템이 MAX_TOASTS=3 초과 시 먼저 들어간 항목을 제거하므로,
    // 가장 중요한 알림을 마지막에 발사하여 큐에서 생존하도록 한다.

    // 4. 새 업적 해제 (가장 낮은 우선순위)
    for (const code of result.newAchievements) {
      const definition = ACHIEVEMENTS.find((a) => a.code === code);
      const displayName = definition?.name ?? code;
      toast(`🏆 업적 해제: ${displayName}`, {
        variant: "success",
        duration: 5000,
      });
    }

    // 3. 마일스톤 달성
    for (const milestone of result.milestones) {
      toast(
        `🔥 ${milestone.milestone}일 연속 학습 달성! +${milestone.xpReward}XP`,
        { variant: "success", duration: 5000 }
      );
    }

    // 2. 리그 포인트 획득 (승급이 아닌 경우만)
    if (result.leaguePoints > 0 && !result.promoted) {
      toast(`⚡ +${result.leaguePoints} 리그 포인트`, { variant: "info" });
    }

    // 1. 리그 승급 (가장 높은 우선순위)
    if (result.promoted && result.newTierName) {
      toast(`🎉 ${result.newTierName} 리그로 승급했습니다!`, {
        variant: "success",
        duration: 5000,
      });
    }
  }, [toast]);

  return { showRewards };
}
