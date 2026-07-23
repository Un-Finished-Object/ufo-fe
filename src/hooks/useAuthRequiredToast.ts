"use client";

import { useCallback } from "react";
import { useToast } from "@/hooks/useToast";

export const AUTH_REQUIRED_MESSAGE = "로그인이 필요한 서비스입니다.";

export function useAuthRequiredToast(durationMs = 2500) {
  const { showToast, toastMessage } = useToast({ durationMs });

  const showAuthRequiredToast = useCallback(() => {
    showToast(AUTH_REQUIRED_MESSAGE);
  }, [showToast]);

  return {
    showAuthRequiredToast,
    showToast,
    toastMessage,
  };
}
