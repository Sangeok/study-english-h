"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/shared/constants";
import { signOut } from "@/shared/lib/client";
import { useToast } from "@/shared/ui";

export function useAppHeaderActions() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const moveToLogin = useCallback(() => {
    router.push(ROUTES.LOGIN);
  }, [router]);

  const handleSignOut = useCallback(async () => {
    if (isSigningOut) {
      return;
    }

    setIsSigningOut(true);
    try {
      await signOut();
      toast("로그아웃되었습니다.", { variant: "success" });
      router.push(ROUTES.HOME);
      router.refresh();
    } catch (error) {
      console.error("Failed to sign out:", error);
      toast("로그아웃 중 문제가 발생했습니다. 다시 시도해주세요.", { variant: "error" });
    } finally {
      setIsSigningOut(false);
    }
  }, [isSigningOut, router, toast]);

  return {
    isSigningOut,
    moveToLogin,
    handleSignOut,
  };
}
