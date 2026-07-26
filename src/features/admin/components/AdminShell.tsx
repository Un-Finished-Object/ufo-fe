"use client";

import { usePathname, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { clearAuthenticatedQueryCache } from "@/features/auth/lib/clearAuthenticatedQueryCache";
import { requestLogout } from "@/features/auth/services/logout";
import { clearAccessToken } from "@/lib/auth/accessToken";
import AdminNavigation from "@/features/admin/components/AdminNavigation";
import { getAdminPageTitle } from "@/features/admin/lib/adminNavigation";
import type { AdminRoutePaths } from "@/features/admin/types/adminRoutePaths";

function MenuIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6 fill-none stroke-current" strokeWidth="2">
      <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6 fill-none stroke-current" strokeWidth="2">
      <path d="m6 6 12 12M18 6 6 18" strokeLinecap="round" />
    </svg>
  );
}

function AdminBrand() {
  return (
    <div>
      <p className="text-xs font-bold tracking-wider text-ufo-brand">UFO ADMIN</p>
      <p className="mt-1 text-sm text-ufo-text-subtle">서비스 운영 관리</p>
    </div>
  );
}

type AdminShellProps = {
  children: ReactNode;
  routes: AdminRoutePaths;
};

export default function AdminShell({ children, routes }: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const pageTitle = getAdminPageTitle(pathname, routes);

  const handleLogout = useCallback(async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    try {
      await requestLogout();
    } finally {
      clearAccessToken();
      clearAuthenticatedQueryCache(queryClient);
      router.replace("/");
    }
  }, [isLoggingOut, queryClient, router]);

  useEffect(() => {
    if (!isMenuOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsMenuOpen(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen]);

  const closeMenu = () => {
    setIsMenuOpen(false);
    window.requestAnimationFrame(() => menuButtonRef.current?.focus());
  };

  return (
    <div className="min-h-dvh bg-ufo-bg text-ufo-text md:flex">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-ufo-divider bg-ufo-surface px-4 py-6 md:flex">
        <div className="px-3"><AdminBrand /></div>
        <div className="mt-8 flex-1"><AdminNavigation routes={routes} /></div>
        <button
          type="button"
          onClick={() => void handleLogout()}
          disabled={isLoggingOut}
          className="mt-6 min-h-12 rounded-xl px-3 text-left text-sm font-semibold text-ufo-text-secondary hover:bg-ufo-bg hover:text-ufo-text disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoggingOut ? "로그아웃 중..." : "로그아웃"}
        </button>
      </aside>

      <div className="mx-auto min-w-0 max-w-[430px] flex-1 bg-ufo-surface md:ml-64 md:max-w-none md:bg-transparent">
        <header className="sticky top-0 z-20 border-b border-ufo-divider bg-ufo-surface/95 backdrop-blur">
          <div className="mx-auto flex h-16 w-full max-w-[1440px] items-center px-4 md:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                ref={menuButtonRef}
                type="button"
                onClick={() => setIsMenuOpen(true)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-ufo-text-secondary md:hidden"
                aria-label="관리자 메뉴 열기"
                aria-expanded={isMenuOpen}
                aria-controls="admin-mobile-menu"
              >
                <MenuIcon />
              </button>
              <div className="min-w-0">
                <p className="text-[11px] font-bold tracking-wider text-ufo-brand md:hidden">UFO ADMIN</p>
                <h1 className="truncate text-base font-semibold">{pageTitle}</h1>
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1440px]">{children}</main>
      </div>

      {isMenuOpen ? (
        <div className="fixed inset-0 z-50 md:hidden" role="presentation">
          <button
            type="button"
            className="absolute inset-0 bg-ufo-text/35"
            onClick={closeMenu}
            aria-label="관리자 메뉴 닫기"
          />
          <section
            id="admin-mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="관리자 메뉴"
            className="relative flex h-full w-[min(84vw,320px)] flex-col bg-ufo-surface px-4 py-5 shadow-xl"
          >
            <div className="flex items-start justify-between px-3">
              <AdminBrand />
              <button
                ref={closeButtonRef}
                type="button"
                onClick={closeMenu}
                className="flex h-10 w-10 items-center justify-center rounded-lg text-ufo-text-secondary"
                aria-label="관리자 메뉴 닫기"
              >
                <CloseIcon />
              </button>
            </div>
            <div className="mt-8 flex-1"><AdminNavigation routes={routes} onNavigate={closeMenu} /></div>
            <button
              type="button"
              onClick={() => void handleLogout()}
              disabled={isLoggingOut}
              className="mt-6 min-h-12 rounded-xl px-3 text-left text-sm font-semibold text-ufo-text-secondary disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoggingOut ? "로그아웃 중..." : "로그아웃"}
            </button>
          </section>
        </div>
      ) : null}
    </div>
  );
}
