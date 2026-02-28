"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

type AuthContextValue = {
  isAuthenticated: boolean;
  status: AuthStatus;
  setAuthenticated: () => void;
  clearAuth: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");

  const setAuthenticated = useCallback(() => {
    setStatus("authenticated");
  }, []);

  const clearAuth = useCallback(() => {
    setStatus("unauthenticated");
  }, []);

  useEffect(() => {
    let isMounted = true;

    const bootstrapAuth = async () => {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE;

      if (!apiBase) {
        if (isMounted) {
          clearAuth();
        }
        return;
      }

      try {
        const refreshResponse = await fetch(`${apiBase}/v1/auth/token/refresh`, {
          method: "POST",
          credentials: "include",
        });

        if (!isMounted) {
          return;
        }

        if (refreshResponse.ok) {
          setAuthenticated();
          return;
        }

        clearAuth();
      } catch {
        if (isMounted) {
          clearAuth();
        }
      }
    };

    void bootstrapAuth();

    return () => {
      isMounted = false;
    };
  }, [clearAuth, setAuthenticated]);

  const value = useMemo(
    () => ({
      isAuthenticated: status === "authenticated",
      status,
      setAuthenticated,
      clearAuth,
    }),
    [status, setAuthenticated, clearAuth],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
