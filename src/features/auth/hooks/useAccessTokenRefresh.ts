"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useSyncExternalStore } from "react";
import { clearAccessToken } from "@/lib/auth/accessToken";
import { ACCESS_TOKEN_REFRESH_INTERVAL_MS, refreshAccessToken } from "@/lib/auth/refreshAccessToken";
import { userQueryKeys } from "@/features/auth/queries/userQueries";

export function useAccessTokenRefresh() {
  const queryClient = useQueryClient();
  const isAuthenticated = useSyncExternalStore(
    (onStoreChange) => queryClient.getQueryCache().subscribe(onStoreChange),
    () => Boolean(queryClient.getQueryData(userQueryKeys.me)),
    () => false,
  );

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const refreshSession = async () => {
      try {
        const response = await refreshAccessToken();

        if (response.ok) {
          return;
        }

        if (response.status === 401 || response.status === 403) {
          clearAccessToken();
          queryClient.setQueryData(userQueryKeys.me, null);
          queryClient.setQueryData(userQueryKeys.wallet, null);
        }
      } catch {
        // Ignore transient network failures and keep the existing session state.
      }
    };

    const intervalId = window.setInterval(() => {
      void refreshSession();
    }, ACCESS_TOKEN_REFRESH_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isAuthenticated, queryClient]);
}
