"use client";

import Link from "next/link";
import ToastMessage from "@/components/common/ToastMessage";
import NavBar from "@/components/navigation/NavBar";
import TopBar from "@/components/navigation/TopBar";
import { useAuthState } from "@/features/auth/hooks/useAuthState";
import { useAuthRequiredToast } from "@/hooks/useAuthRequiredToast";

export default function StylesPage() {
  const { authStatus, isAuthenticated } = useAuthState();
  const { showAuthRequiredToast, toastMessage } = useAuthRequiredToast();
  const profileHref = isAuthenticated ? "/my" : "/login";

  return (
    <div className="min-h-screen bg-ufo-bg">
      <main className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col overflow-hidden bg-ufo-surface text-ufo-text">
        <TopBar
          left="logo"
          leftHref="/"
          right={[
            { type: "chat", href: "/chats", ariaLabel: "채팅" },
            { type: "profile", href: profileHref, ariaLabel: "프로필" },
          ]}
        />
        <NavBar />

        <section className="px-5 pb-10 pt-5">
          <div className="w-full rounded-[32px] border border-ufo-border bg-white px-6 py-10 text-center">
            <p className="text-[32px] font-semibold tracking-[-0.04em] text-ufo-brand">Coming Soon</p>
            <p className="mt-3 text-sm text-ufo-text-secondary">스타일 페이지를 준비 중 입니다.</p>

            <div className="mt-8 flex gap-3">
              <Link
                href="/patterns"
                className="inline-flex flex-1 items-center justify-center rounded-full border border-ufo-border bg-white px-4 py-3 text-sm font-semibold text-ufo-brand transition-colors hover:bg-ufo-brand hover:text-white"
              >
                도안 페이지로 이동
              </Link>
              <Link
                href="/scraps"
                onClick={(event) => {
                  if (authStatus === "loading" || isAuthenticated) {
                    return;
                  }

                  event.preventDefault();
                  showAuthRequiredToast();
                }}
                className="inline-flex flex-1 items-center justify-center rounded-full border border-ufo-border bg-white px-4 py-3 text-sm font-semibold text-ufo-brand transition-colors hover:bg-ufo-brand hover:text-white"
              >
                찜 페이지로 이동
              </Link>
            </div>
          </div>
        </section>
      </main>
      <ToastMessage message={toastMessage} />
    </div>
  );
}
