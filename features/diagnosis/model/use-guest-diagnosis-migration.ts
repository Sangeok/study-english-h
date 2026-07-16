"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/shared/lib";
import {
  migrateGuestDiagnosis,
  type GuestDiagnosisMigrationOutcome,
} from "../api/diagnosis-api";
import {
  clearGuestDiagnosis,
  readGuestDiagnosis,
  type CachedGuestDiagnosis,
} from "../lib/guest-diagnosis-storage";

export type GuestDiagnosisMigrationState =
  | { phase: "checking" }
  | { phase: "idle" }
  | { phase: "migrating" }
  | { phase: "clearing"; outcome: GuestDiagnosisMigrationOutcome }
  | { phase: "refreshing"; outcome: GuestDiagnosisMigrationOutcome }
  | { phase: "complete"; outcome: GuestDiagnosisMigrationOutcome }
  | { phase: "error"; reason: "invalid-cache" }
  | { phase: "error"; reason: "storage-unavailable" }
  | { phase: "error"; reason: "migration-failed" }
  | {
      phase: "error";
      reason: "clear-failed" | "refresh-failed";
      outcome: GuestDiagnosisMigrationOutcome;
    };

function getInitialState(
  isAuthenticated: boolean
): GuestDiagnosisMigrationState {
  if (isAuthenticated) {
    return { phase: "checking" };
  }

  return { phase: "idle" };
}

export function useGuestDiagnosisMigration(isAuthenticated: boolean) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [state, setState] = useState<GuestDiagnosisMigrationState>(() =>
    getInitialState(isAuthenticated)
  );
  const cachedDiagnosisRef = useRef<CachedGuestDiagnosis | null>(null);
  const hasStartedMigrationRef = useRef(false);

  const refreshHome = useCallback(
    async (outcome: GuestDiagnosisMigrationOutcome) => {
      setState({ phase: "refreshing", outcome });

      try {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: queryKeys.diagnosis.all,
          }),
          queryClient.invalidateQueries({
            queryKey: queryKeys.profile.all,
          }),
        ]);
        router.refresh();
        setState({ phase: "complete", outcome });
      } catch {
        setState({ phase: "error", reason: "refresh-failed", outcome });
      }
    },
    [queryClient, router]
  );

  const clearCacheAfterPersistence = useCallback(
    (outcome: GuestDiagnosisMigrationOutcome) => {
      setState({ phase: "clearing", outcome });
      const clearResult = clearGuestDiagnosis();

      if (clearResult.status === "unavailable") {
        setState({ phase: "error", reason: "clear-failed", outcome });
        return;
      }

      cachedDiagnosisRef.current = null;
      void refreshHome(outcome);
    },
    [refreshHome]
  );

  const runMigration = useCallback(
    async (cachedDiagnosis: CachedGuestDiagnosis) => {
      setState({ phase: "migrating" });

      try {
        const outcome = await migrateGuestDiagnosis({
          answers: cachedDiagnosis.answers,
        });
        clearCacheAfterPersistence(outcome);
      } catch {
        setState({ phase: "error", reason: "migration-failed" });
      }
    },
    [clearCacheAfterPersistence]
  );

  const readCacheAndStart = useCallback(() => {
    setState({ phase: "checking" });
    const readResult = readGuestDiagnosis();

    if (readResult.status === "empty") {
      cachedDiagnosisRef.current = null;
      setState({ phase: "idle" });
      return;
    }

    if (readResult.status === "invalid") {
      cachedDiagnosisRef.current = null;
      setState({ phase: "error", reason: "invalid-cache" });
      return;
    }

    if (readResult.status === "unavailable") {
      cachedDiagnosisRef.current = null;
      setState({ phase: "error", reason: "storage-unavailable" });
      return;
    }

    cachedDiagnosisRef.current = readResult.diagnosis;
    void runMigration(readResult.diagnosis);
  }, [runMigration]);

  useEffect(() => {
    let cancelled = false;

    if (!isAuthenticated) {
      hasStartedMigrationRef.current = false;
      cachedDiagnosisRef.current = null;
      queueMicrotask(() => {
        if (!cancelled) {
          setState({ phase: "idle" });
        }
      });
      return () => {
        cancelled = true;
      };
    }

    if (hasStartedMigrationRef.current) {
      return;
    }

    queueMicrotask(() => {
      if (cancelled || hasStartedMigrationRef.current) {
        return;
      }

      hasStartedMigrationRef.current = true;
      readCacheAndStart();
    });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, readCacheAndStart]);

  const discardInvalidCache = useCallback(() => {
    const clearResult = clearGuestDiagnosis();

    if (clearResult.status === "unavailable") {
      setState({ phase: "error", reason: "invalid-cache" });
      return;
    }

    setState({ phase: "idle" });
  }, []);

  const retryMigration = useCallback(() => {
    if (!cachedDiagnosisRef.current) {
      readCacheAndStart();
      return;
    }

    void runMigration(cachedDiagnosisRef.current);
  }, [readCacheAndStart, runMigration]);

  const retryClear = useCallback(() => {
    if (state.phase !== "error" || state.reason !== "clear-failed") {
      return;
    }

    clearCacheAfterPersistence(state.outcome);
  }, [clearCacheAfterPersistence, state]);

  const retryRefresh = useCallback(() => {
    if (state.phase !== "error" || state.reason !== "refresh-failed") {
      return;
    }

    void refreshHome(state.outcome);
  }, [refreshHome, state]);

  return {
    state,
    retryRead: readCacheAndStart,
    discardInvalidCache,
    retryMigration,
    retryClear,
    retryRefresh,
  };
}
