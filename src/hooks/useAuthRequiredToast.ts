"use client";

import { useCallback } from "react";
import { useToast } from "@/hooks/useToast";

export const AUTH_REQUIRED_MESSAGE = "해당 서비스는 로그인 후 사용하실 수 있습니다.";

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
