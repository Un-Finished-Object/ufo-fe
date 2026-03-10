"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { useAccessTokenRefresh } from "@/hooks/useAccessTokenRefresh";
import { createQueryClient } from "@/lib/query/client";
import ChatConnectionProvider from "@/src/providers/ChatConnectionProvider";

type ProvidersProps = {
  children: ReactNode;
};

function AuthRefreshManager() {
  useAccessTokenRefresh();

  return null;
}

export default function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(createQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthRefreshManager />
      <ChatConnectionProvider>{children}</ChatConnectionProvider>
    </QueryClientProvider>
  );
}
