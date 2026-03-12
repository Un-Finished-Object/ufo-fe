"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { refreshAccessToken } from "@/lib/auth/refreshAccessToken";

type PopupMessageType = "oauth-success" | "oauth-failed";

function notifyOpener(type: PopupMessageType) {
  if (window.opener && !window.opener.closed) {
    window.opener.postMessage({ type }, window.location.origin);
  }
}

export default function AuthPopupCompletePage() {
  const router = useRouter();

  useEffect(() => {
    const finalizePopupLogin = async () => {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE;

      if (!apiBase) {
        notifyOpener("oauth-failed");
        window.close();
        router.replace("/login?error=network");
        return;
      }

      try {
        const refreshResponse = await refreshAccessToken({ apiBase });

        if (!refreshResponse.ok) {
          notifyOpener("oauth-failed");
          window.close();
          router.replace("/login?error=oauth_failed");
          return;
        }

        notifyOpener("oauth-success");
        window.close();
      } catch {
        notifyOpener("oauth-failed");
        window.close();
        router.replace("/login?error=oauth_failed");
      }
    };

    void finalizePopupLogin();
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-ufo-bg px-4">
      <section className="flex w-full max-w-[430px] flex-col items-center justify-center rounded-2xl bg-ufo-surface py-14 shadow-sm">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-ufo-brand-soft border-t-ufo-brand" />
        <p className="mt-4 text-sm font-medium text-ufo-text">Signing you in…</p>
      </section>
    </main>
  );
}
