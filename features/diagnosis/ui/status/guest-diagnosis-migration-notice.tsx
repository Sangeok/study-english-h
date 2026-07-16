"use client";

import type { ReactNode } from "react";
import { useGuestDiagnosisMigration } from "../../model/use-guest-diagnosis-migration";

interface GuestDiagnosisMigrationNoticeProps {
  isAuthenticated: boolean;
  children: ReactNode;
}

interface NoticeContent {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function GuestDiagnosisMigrationNotice({
  isAuthenticated,
  children,
}: GuestDiagnosisMigrationNoticeProps) {
  const migration = useGuestDiagnosisMigration(isAuthenticated);
  const { state } = migration;

  if (state.phase === "idle") {
    return children;
  }

  if (state.phase === "complete") {
    let description = "기존 진단 기록을 유지하고 임시 결과를 정리했어요.";

    if (state.outcome.outcome === "created") {
      description = "진단 결과가 계정에 저장됐어요. 딱 맞는 레벨에서 시작해요!";
    }

    return (
      <>
        <div className="bg-teal/10 px-6 py-3 text-center text-sm font-semibold text-teal-edge">
          {description}
        </div>
        {children}
      </>
    );
  }

  let notice: NoticeContent = {
    title: "진단 결과를 확인하고 있어요",
    description: "잠시만 기다려 주세요.",
  };

  if (state.phase === "migrating") {
    notice = {
      title: "진단 결과를 저장하고 있어요",
      description: "계정에 맞는 학습 레벨을 준비하고 있어요.",
    };
  }

  if (state.phase === "clearing") {
    notice = {
      title: "임시 결과를 정리하고 있어요",
      description: "계정 저장은 완료됐어요. 잠시만 기다려 주세요.",
    };
  }

  if (state.phase === "refreshing") {
    notice = {
      title: "학습 화면을 업데이트하고 있어요",
      description: "저장된 진단 결과를 불러오고 있어요.",
    };
  }

  if (state.phase === "error") {
    if (state.reason === "invalid-cache") {
      notice = {
        title: "임시 진단 결과가 손상됐어요",
        description: "손상된 결과를 삭제한 뒤 홈을 계속 이용할 수 있어요.",
        actionLabel: "임시 결과 삭제하고 홈 계속",
        onAction: migration.discardInvalidCache,
      };
    }

    if (state.reason === "storage-unavailable") {
      notice = {
        title: "임시 진단 결과를 확인하지 못했어요",
        description: "브라우저 저장소에 다시 접근해 볼게요.",
        actionLabel: "다시 확인",
        onAction: migration.retryRead,
      };
    }

    if (state.reason === "migration-failed") {
      notice = {
        title: "진단 결과를 계정에 저장하지 못했어요",
        description: "임시 결과는 그대로 남아 있어요. 같은 화면에서 다시 시도해 주세요.",
        actionLabel: "결과 다시 저장",
        onAction: migration.retryMigration,
      };
    }

    if (state.reason === "clear-failed") {
      notice = {
        title: "계정 저장은 완료됐지만 임시 결과를 정리하지 못했어요",
        description: "진단을 다시 제출하지 않고 임시 결과만 정리할게요.",
        actionLabel: "임시 결과 다시 정리",
        onAction: migration.retryClear,
      };
    }

    if (state.reason === "refresh-failed") {
      notice = {
        title: "계정 저장은 완료됐지만 화면을 업데이트하지 못했어요",
        description: "진단을 다시 제출하지 않고 저장된 결과만 다시 불러올게요.",
        actionLabel: "화면 새로고침",
        onAction: migration.retryRefresh,
      };
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream-canvas px-4">
      <div className="tactile-card tactile-card--raised w-full max-w-lg p-8 text-center">
        <h2 className="font-display text-2xl font-bold text-ink">
          {notice.title}
        </h2>
        <p className="mt-3 text-sm text-ink-soft">{notice.description}</p>
        {notice.actionLabel && notice.onAction && (
          <button
            type="button"
            onClick={notice.onAction}
            className="tactile-btn tactile-btn--teal tactile-btn--lg mt-8"
          >
            {notice.actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}
