"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useSyncExternalStore } from "react";
import {
  clearAccessToken,
  getAccessToken,
  getAccessTokenExpiresAt,
  subscribeAccessToken,
} from "@/lib/auth/accessToken";
import { refreshAccessToken } from "@/lib/auth/refreshAccessToken";
import { userQueryKeys } from "@/features/auth/queries/userQueries";
import { clearAuthenticatedQueryCache } from "@/features/auth/lib/clearAuthenticatedQueryCache";

const ACCESS_TOKEN_REFRESH_LEAD_MS = 60 * 1000;
const ACCESS_TOKEN_REFRESH_RETRY_MS = 30 * 1000;

export function useAccessTokenRefresh() {
  const queryClient = useQueryClient();
  const isAuthenticated = useSyncExternalStore(
    (onStoreChange) => queryClient.getQueryCache().subscribe(onStoreChange),
    () => Boolean(queryClient.getQueryData(userQueryKeys.me)),
    () => false,
  );
  const accessToken = useSyncExternalStore(
    subscribeAccessToken,
    getAccessToken,
    () => null,
  );
  const accessTokenExpiresAt = useSyncExternalStore(
    subscribeAccessToken,
    getAccessTokenExpiresAt,
    () => null,
  );

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
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
        void refreshSession();
      }, Math.max(0, delayMs));
    };

    const refreshSession = async () => {
      clearRefreshTimer();

      try {
        const response = await refreshAccessToken({ mode: "auto" });

        if (response.ok) {
          return;
        }

        if (response.status === 401 || response.status === 403) {
          clearAccessToken();
          clearAuthenticatedQueryCache(queryClient);
          return;
        }

        scheduleRefresh(ACCESS_TOKEN_REFRESH_RETRY_MS);
      } catch {
        scheduleRefresh(ACCESS_TOKEN_REFRESH_RETRY_MS);
      }
    };

    const refreshIfNeeded = () => {
      if (
        document.visibilityState !== "visible" ||
        (accessTokenExpiresAt !== null &&
          accessTokenExpiresAt - Date.now() > ACCESS_TOKEN_REFRESH_LEAD_MS)
      ) {
        return;
      }

      void refreshSession();
    };

    const handleVisibilityChange = () => {
      refreshIfNeeded();
    };

    const refreshDelay = accessTokenExpiresAt
      ? accessTokenExpiresAt - Date.now() - ACCESS_TOKEN_REFRESH_LEAD_MS
      : 0;

    scheduleRefresh(refreshDelay);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", refreshIfNeeded);
    window.addEventListener("online", refreshIfNeeded);
    window.addEventListener("pageshow", refreshIfNeeded);

    return () => {
      isActive = false;
      clearRefreshTimer();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", refreshIfNeeded);
      window.removeEventListener("online", refreshIfNeeded);
      window.removeEventListener("pageshow", refreshIfNeeded);
    };
  }, [accessToken, accessTokenExpiresAt, isAuthenticated, queryClient]);
}
