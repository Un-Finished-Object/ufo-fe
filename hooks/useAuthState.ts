"use client";

import { useMeQuery } from "@/hooks/queries/useMeQuery";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

export function useAuthState() {
  const meQuery = useMeQuery();
  const isAuthenticated = Boolean(meQuery.data);

  const authStatus: AuthStatus = meQuery.isPending
    ? "loading"
    : isAuthenticated
      ? "authenticated"
      : "unauthenticated";

  return {
    ...meQuery,
    authStatus,
    isAuthenticated,
  };
}
