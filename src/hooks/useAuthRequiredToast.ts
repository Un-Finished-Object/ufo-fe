"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export const AUTH_REQUIRED_MESSAGE = "해당 서비스는 로그인 후 사용하실 수 있습니다.";

export function useAuthRequiredToast(durationMs = 2500) {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const showToast = useCallback(
    (message: string) => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }

      setToastMessage(message);
      toastTimerRef.current = setTimeout(() => {
        setToastMessage(null);
        toastTimerRef.current = null;
      }, durationMs);
    },
    [durationMs],
  );

  const showAuthRequiredToast = useCallback(() => {
    showToast(AUTH_REQUIRED_MESSAGE);
  }, [showToast]);

  return {
    showAuthRequiredToast,
    showToast,
    toastMessage,
  };
}
