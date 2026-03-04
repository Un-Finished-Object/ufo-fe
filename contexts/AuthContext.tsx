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

export type UserProfile = {
  email: string;
  nickname: string;
  profileImage: string;
};

type AuthContextValue = {
  isAuthenticated: boolean;
  status: AuthStatus;
  userProfile: UserProfile | null;
  setAuthenticated: () => void;
  clearAuth: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const setAuthenticated = useCallback(() => {
    setStatus("authenticated");
  }, []);

  const clearAuth = useCallback(() => {
    setStatus("unauthenticated");
    setUserProfile(null);
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

  useEffect(() => {
    if (status !== "authenticated") {
      return;
    }

    const apiBase = process.env.NEXT_PUBLIC_API_BASE;

    if (!apiBase) {
      setUserProfile(null);
      return;
    }

    let isMounted = true;

    const fetchMyProfile = async () => {
      try {
        const response = await fetch(`${apiBase}/v1/users/me`, {
          method: "GET",
          credentials: "include",
        });

        const rawBody = await response.text();
        console.log("[AuthContext] GET /v1/users/me response:", rawBody);

        if (!isMounted) {
          return;
        }

        if (!response.ok) {
          setUserProfile(null);
          if (response.status === 401) {
            clearAuth();
          }
          return;
        }

        const payload = JSON.parse(rawBody) as {
          data?: {
            email?: string;
            nickname?: string;
            profileImage?: string;
          };
          error?: unknown;
        };

        if (payload.error || !payload.data) {
          setUserProfile(null);
          return;
        }

        setUserProfile({
          email: payload.data.email ?? "",
          nickname: payload.data.nickname ?? "",
          profileImage: payload.data.profileImage ?? "",
        });
      } catch {
        if (isMounted) {
          setUserProfile(null);
        }
      }
    };

    void fetchMyProfile();

    return () => {
      isMounted = false;
    };
  }, [clearAuth, status]);

  const value = useMemo(
    () => ({
      isAuthenticated: status === "authenticated",
      status,
      userProfile,
      setAuthenticated,
      clearAuth,
    }),
    [status, userProfile, setAuthenticated, clearAuth],
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
