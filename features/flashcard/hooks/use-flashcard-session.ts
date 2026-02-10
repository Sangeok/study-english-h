/**
 * Flashcard Session Hook
 *
 * React Query hook for fetching flashcard session data
 */

"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/shared/lib";
import { fetchFlashcardSession } from "../lib/flashcard-api";

export function useFlashcardSession(mode: "review" | "new", limit: number = 20) {
  return useQuery({
    queryKey: queryKeys.flashcard.session(mode),
    queryFn: () => fetchFlashcardSession(mode, limit),
    staleTime: 0, // Always refetch to get latest due cards
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
  });
}
