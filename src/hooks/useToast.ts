"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const DEFAULT_TOAST_DURATION_MS = 2500;

type UseToastOptions = {
  durationMs?: number;
  initialMessage?: string | null;
};

export function useToast({
  durationMs = DEFAULT_TOAST_DURATION_MS,
  initialMessage = null,
}: UseToastOptions = {}) {
  const [toastMessage, setToastMessage] = useState<string | null>(initialMessage);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearToastTimer = useCallback(() => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
  }, []);

  const dismissToast = useCallback(() => {
    clearToastTimer();
    setToastMessage(null);
  }, [clearToastTimer]);

  const showToast = useCallback(
    (message: string) => {
      clearToastTimer();
      setToastMessage(message);
      toastTimerRef.current = setTimeout(() => {
        setToastMessage(null);
        toastTimerRef.current = null;
      }, durationMs);
    },
    [clearToastTimer, durationMs],
  );

  useEffect(() => {
    if (initialMessage) {
      toastTimerRef.current = setTimeout(() => {
        setToastMessage(null);
        toastTimerRef.current = null;
      }, durationMs);
    }

    return clearToastTimer;
  }, [clearToastTimer, durationMs, initialMessage]);

  return {
    dismissToast,
    showToast,
    toastMessage,
  };
}
