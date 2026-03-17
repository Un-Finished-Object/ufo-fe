"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useAccessToken } from "@/hooks/useAccessToken";
import { useAccessTokenRefresh } from "@/hooks/useAccessTokenRefresh";
import { useAuthState } from "@/hooks/useAuthState";
import { createQueryClient } from "@/lib/query/client";
import { activateStompClient, deactivateStompClient } from "@/src/lib/websocket/stompClient";

type ProvidersProps = {
  children: ReactNode;
};

function AuthRefreshManager() {
  useAccessTokenRefresh();

  return null;
}

function WebSocketConnectionManager() {
  const accessToken = useAccessToken();
  const { authStatus, isAuthenticated } = useAuthState();
  const isConnectedRef = useRef(false);

  useEffect(() => {
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
      {children}
    </QueryClientProvider>
  );
}
