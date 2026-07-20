"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { refreshAccessToken } from "@/lib/auth/refreshAccessToken";
import { clearAuthenticatedQueryCache } from "@/features/auth/lib/clearAuthenticatedQueryCache";
import {
  meQueryOptions,
  walletQueryOptions,
} from "@/features/auth/queries/userQueries";
import MobileShell from "@/components/layout/MobileShell";

export default function AuthCompletePage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    let isMounted = true;

    const finalizeLogin = async () => {
      try {
        const refreshResponse = await refreshAccessToken({ mode: "required" });

        if (!refreshResponse.ok) {
          router.replace("/login?error=oauth_failed");
          return;
        }

        if (!isMounted) {
          return;
        }

        clearAuthenticatedQueryCache(queryClient);
        const me = await queryClient.fetchQuery({
          ...meQueryOptions(),
          staleTime: 0,
        });
        if (!me) {
          router.replace("/login?error=oauth_failed");
          return;
        }

        void queryClient.prefetchQuery({
          ...walletQueryOptions(),
          staleTime: 0,
        });
        router.replace("/auth/signup");
      } catch {
        router.replace("/login?error=oauth_failed");
      }
    };

    void finalizeLogin();

    return () => {
      isMounted = false;
    };
  }, [queryClient, router]);

  return (
    <MobileShell surfaceClassName="flex items-center justify-center px-4">
      <section className="flex w-full flex-col items-center justify-center rounded-2xl bg-ufo-surface py-14 shadow-sm">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-ufo-brand-soft border-t-ufo-brand" />
        <p className="mt-4 text-sm font-medium text-ufo-text">Signing you in…</p>
      </section>
    </MobileShell>
  );
}
