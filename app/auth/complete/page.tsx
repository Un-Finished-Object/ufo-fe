"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { refreshAccessToken } from "@/lib/auth/refreshAccessToken";
import { meQueryOptions, walletQueryOptions } from "@/lib/queries/user";

export default function AuthCompletePage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    let isMounted = true;

    const finalizeLogin = async () => {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE;

      if (!apiBase) {
        router.replace("/login?error=network");
        return;
      }

      try {
        const refreshResponse = await refreshAccessToken({ apiBase });

        if (!refreshResponse.ok) {
          router.replace("/login?error=oauth_failed");
          return;
        }

        if (!isMounted) {
          return;
        }

        const me = await queryClient.fetchQuery(meQueryOptions());
        if (!me) {
          router.replace("/login?error=oauth_failed");
          return;
        }

        void queryClient.prefetchQuery(walletQueryOptions());
        router.replace("/");
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
    <main className="flex min-h-screen items-center justify-center bg-ufo-bg px-4">
      <section className="flex w-full max-w-[430px] flex-col items-center justify-center rounded-2xl bg-ufo-surface py-14 shadow-sm">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-ufo-brand-soft border-t-ufo-brand" />
        <p className="mt-4 text-sm font-medium text-ufo-text">Signing you in…</p>
      </section>
    </main>
  );
}
