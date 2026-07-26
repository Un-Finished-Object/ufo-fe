"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useSyncExternalStore } from "react";
import {
  getAccessTokenSnapshot,
  getInitialAccessTokenSnapshot,
  subscribeAccessToken,
} from "@/lib/auth/accessToken";
import {
  ensureFreshAccessToken,
  isAccessTokenRefreshDue,
  type RefreshReason,
} from "@/lib/auth/refreshCoordinator";
import { userQueryKeys } from "@/features/auth/queries/userQueries";

const MAX_TIMER_DELAY_MS = 2_147_000_000;

export function useAccessTokenRefresh() {
  const queryClient = useQueryClient();
  const isAuthenticated = useSyncExternalStore(
    (onStoreChange) => queryClient.getQueryCache().subscribe(onStoreChange),
    () => Boolean(queryClient.getQueryData(userQueryKeys.me)),
    () => false,
  );
  const tokenSnapshot = useSyncExternalStore(
    subscribeAccessToken,
    getAccessTokenSnapshot,
    getInitialAccessTokenSnapshot,
  );

  useEffect(() => {
    if (
      !isAuthenticated ||
      !tokenSnapshot.token ||
      tokenSnapshot.sessionPhase !== "active"
    ) {
      return;
    }

    let isActive = true;
    let refreshTimerId: number | null = null;

    const clearRefreshTimer = () => {
      if (refreshTimerId === null) {
        return;
      }

      window.clearTimeout(refreshTimerId);
      refreshTimerId = null;
    };

    const scheduleRefresh = (delayMs: number) => {
      if (!isActive) {
        return;
      }

      clearRefreshTimer();
      refreshTimerId = window.setTimeout(() => {
        void runRefresh("scheduled");
      }, Math.min(MAX_TIMER_DELAY_MS, Math.max(0, delayMs)));
    };

    const runRefresh = async (reason: RefreshReason) => {
      clearRefreshTimer();
      const result = await ensureFreshAccessToken({ reason });

      if (!isActive) {
        return;
      }

      if (result.type === "transient-error") {
        scheduleRefresh(result.retryAfterMs);
        return;
      }

      const currentSnapshot = getAccessTokenSnapshot();

      if (currentSnapshot.token && currentSnapshot.refreshAtMs !== null) {
        scheduleRefresh(currentSnapshot.refreshAtMs - Date.now());
      }
    };

    const refreshIfNeeded = (reason: "visibility" | "online") => {
      const currentSnapshot = getAccessTokenSnapshot();

      if (
        document.visibilityState !== "visible" ||
        !currentSnapshot.token ||
        !isAccessTokenRefreshDue(Date.now(), currentSnapshot)
      ) {
        return;
      }

      void runRefresh(reason);
    };

    const handleVisibilityChange = () => {
      refreshIfNeeded("visibility");
    };
    const handleOnline = () => {
      refreshIfNeeded("online");
    };

    scheduleRefresh((tokenSnapshot.refreshAtMs ?? Date.now()) - Date.now());
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("online", handleOnline);
    window.addEventListener("pageshow", handleVisibilityChange);

    return () => {
      isActive = false;
      clearRefreshTimer();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("pageshow", handleVisibilityChange);
    };
  }, [
    isAuthenticated,
    tokenSnapshot.refreshAtMs,
    tokenSnapshot.revision,
    tokenSnapshot.sessionPhase,
    tokenSnapshot.token,
  ]);
}
