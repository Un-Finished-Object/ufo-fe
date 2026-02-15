"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth, type AuthUser } from "@/contexts/AuthContext";

type RefreshResponse = {
  accessToken?: string;
  access_token?: string;
};

export default function AuthCompletePage() {
  const router = useRouter();
  const { setAuth } = useAuth();

  useEffect(() => {
    let isMounted = true;

    const finalizeLogin = async () => {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE;

      if (!apiBase) {
        router.replace("/login?error=network");
        return;
      }

      let accessToken: string;

      try {
        const refreshResponse = await fetch(`${apiBase}/auth/refresh`, {
          method: "POST",
          credentials: "include",
        });

        if (!refreshResponse.ok) {
          router.replace("/login?error=oauth_failed");
          return;
        }

        const refreshData = (await refreshResponse.json()) as RefreshResponse;
        accessToken = refreshData.accessToken ?? refreshData.access_token ?? "";

        if (!accessToken) {
          router.replace("/login?error=oauth_failed");
          return;
        }
      } catch {
        router.replace("/login?error=oauth_failed");
        return;
      }

      try {
        const meResponse = await fetch(`${apiBase}/auth/me`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!meResponse.ok) {
          router.replace("/login?error=unauthorized");
          return;
        }

        const user = (await meResponse.json()) as AuthUser;

        if (!isMounted) {
          return;
        }

        setAuth(accessToken, user);
        router.replace("/");
      } catch {
        router.replace("/login?error=unauthorized");
      }
    };

    void finalizeLogin();

    return () => {
      isMounted = false;
    };
  }, [router, setAuth]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f4f5f7] px-4">
      <section className="flex w-full max-w-[430px] flex-col items-center justify-center rounded-2xl bg-white py-14 shadow-sm">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#f1cad1] border-t-[#eb9ca7]" />
        <p className="mt-4 text-sm font-medium text-[#4c4c4c]">Signing you in…</p>
      </section>
    </main>
  );
}
