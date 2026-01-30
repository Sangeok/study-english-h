"use client";

import { useState } from "react";
import { signIn } from "@/lib/auth-client";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleKakaoLogin = async () => {
    setIsLoading(true);
    try {
      await signIn.social({
        provider: "kakao",
      });
    } catch (error) {
      console.error("Error logging in with GitHub:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <button onClick={handleKakaoLogin}>Kakao Login</button>
    </div>
  );
}
