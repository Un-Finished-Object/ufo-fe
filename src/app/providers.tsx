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
import {
  activateStompClient,
  deactivateStompClient,
  restartStompClient,
} from "@/features/chat/lib/stompClient";
import { isMockMode } from "@/mocks/config";
import { useChatRealtimeStore } from "@/features/chat/stores/useChatRealtimeStore";
import { clearPendingChatReads } from "@/features/chat/lib/chatReadReceiptQueue";

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
  const previousAccessTokenRef = useRef<string | null>(null);
  const connectionOperationRef = useRef(0);
  const connectionRestartTaskRef = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    const operationId = ++connectionOperationRef.current;

    if (isMockMode()) {
      useChatRealtimeStore.getState().setConnectionStatus("connected");
      return;
    }

    if (authStatus === "loading") {
      return;
    }

    if (isAuthenticated && accessToken) {
      const previousAccessToken = previousAccessTokenRef.current;
      previousAccessTokenRef.current = accessToken;

      if (!isConnectedRef.current) {
        useChatRealtimeStore.getState().setConnectionStatus("connecting");
        activateStompClient({
          onBeforeConnect: () => {
            useChatRealtimeStore.getState().setConnectionStatus("connecting");
          },
          onConnect: () => {
            useChatRealtimeStore.getState().setConnectionStatus("connected");
          },
          onStompError: () => {
            useChatRealtimeStore.getState().setConnectionStatus("disconnected");
          },
          onWebSocketClose: () => {
            useChatRealtimeStore.getState().setConnectionStatus("disconnected");
            useChatRealtimeStore.getState().setSubscribedRoomIds([]);
          },
        });
        isConnectedRef.current = true;
        return;
      }

      if (previousAccessToken && previousAccessToken !== accessToken) {
        connectionRestartTaskRef.current = connectionRestartTaskRef.current
          .catch(() => undefined)
          .then(async () => {
            if (
              connectionOperationRef.current !== operationId ||
              !isConnectedRef.current
            ) {
              return;
            }

            await restartStompClient(
              () =>
                connectionOperationRef.current === operationId && isConnectedRef.current,
            );
          });
      }

      return;
    }

    previousAccessTokenRef.current = null;
    clearPendingChatReads();

    if (!isConnectedRef.current) {
      return;
    }

    void deactivateStompClient();
    useChatRealtimeStore.getState().setConnectionStatus("disconnected");
    useChatRealtimeStore.getState().setSubscribedRoomIds([]);
    isConnectedRef.current = false;
  }, [accessToken, authStatus, isAuthenticated]);

  useEffect(() => {
    return () => {
      if (!isConnectedRef.current) {
        return;
      }

      void deactivateStompClient();
      connectionOperationRef.current += 1;
      previousAccessTokenRef.current = null;
      useChatRealtimeStore.getState().setConnectionStatus("disconnected");
      useChatRealtimeStore.getState().setSubscribedRoomIds([]);
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
