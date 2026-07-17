"use client";

import { QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useAccessToken } from "@/features/auth/hooks/useAccessToken";
import { useAccessTokenRefresh } from "@/features/auth/hooks/useAccessTokenRefresh";
import { useAuthState } from "@/features/auth/hooks/useAuthState";
import { clearAuthenticatedQueryCache } from "@/features/auth/lib/clearAuthenticatedQueryCache";
import ChatRealtimeManager from "@/features/chat/components/ChatRealtimeManager";
import ChatRealtimeToastHost from "@/features/chat/components/ChatRealtimeToastHost";
import { createQueryClient } from "@/lib/query/client";
import { activateStompClient, deactivateStompClient } from "@/features/chat/lib/stompClient";
import { isMockMode } from "@/mocks/config";

type ProvidersProps = {
  children: ReactNode;
};

function AuthRefreshManager() {
  const queryClient = useQueryClient();
  const accessToken = useAccessToken();
  const { authStatus } = useAuthState();

  useAccessTokenRefresh();

  useEffect(() => {
    if (authStatus === "authenticated" && !accessToken) {
      clearAuthenticatedQueryCache(queryClient);
    }
  }, [accessToken, authStatus, queryClient]);

  return null;
}

function WebSocketConnectionManager() {
  const accessToken = useAccessToken();
  const { authStatus, isAuthenticated } = useAuthState();
  const isConnectedRef = useRef(false);

  useEffect(() => {
    if (isMockMode()) {
      return;
    }

    if (authStatus === "loading") {
      return;
    }

    if (isAuthenticated && accessToken) {
      activateStompClient();
      isConnectedRef.current = true;
      return;
    }

    if (!isConnectedRef.current) {
      return;
    }

    void deactivateStompClient();
    isConnectedRef.current = false;
  }, [accessToken, authStatus, isAuthenticated]);

  useEffect(() => {
    return () => {
      if (!isConnectedRef.current) {
        return;
      }

      void deactivateStompClient();
      isConnectedRef.current = false;
    };
  }, []);

  return null;
}

export default function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(createQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthRefreshManager />
      <WebSocketConnectionManager />
      {!isMockMode() && <ChatRealtimeManager />}
      <ChatRealtimeToastHost />
      {children}
    </QueryClientProvider>
  );
}
