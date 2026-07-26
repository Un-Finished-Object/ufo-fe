"use client";

import { useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";
import StateBlock from "@/components/common/StateBlock";
import ToastMessage from "@/components/common/ToastMessage";
import CreditBadge from "@/components/credits/CreditBadge";
import EditIcon from "@/components/icons/EditIcon";
import MobileShell from "@/components/layout/MobileShell";
import TopBar from "@/components/navigation/TopBar";
import { useMeQuery } from "@/features/auth/hooks/useMeQuery";
import { useWalletQuery } from "@/features/auth/hooks/useWalletQuery";
import { clearAuthenticatedQueryCache } from "@/features/auth/lib/clearAuthenticatedQueryCache";
import { clearAccessToken } from "@/lib/auth/accessToken";
import { useAuthRequiredToast } from "@/hooks/useAuthRequiredToast";
import { myHelpMenuItems } from "@/features/my/lib/helpPages";
import { requestLogout } from "@/features/auth/services/logout";

type MenuItem = {
  label: string;
  href?: string;
  external?: boolean;
  onClick?: () => void | Promise<void>;
};

function MenuSection({ title, items }: { title: string; items: MenuItem[] }) {
  return (
    <section>
      <h2 className="ml-8 pb-2 text-sm font-medium text-ufo-text-muted">{title}</h2>
      <div className="border-t border-ufo-border py-4">
        <ul className="ml-10 space-y-3 text-lg leading-[1.15] tracking-[-0.02em] text-ufo-text-subtle">
          {items.map((item) => (
            <li key={item.label}>
              {item.href && item.external ? (
                <a href={item.href} target="_blank" rel="noreferrer" className="text-inherit">
                  {item.label}
                </a>
              ) : item.href ? (
                <Link href={item.href} className="text-inherit">
                  {item.label}
                </Link>
              ) : item.onClick ? (
                <button type="button" onClick={item.onClick} className="text-inherit">
                  {item.label}
                </button>
              ) : (
                item.label
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export default function MyPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isLoggingOutRef = useRef(false);
  const { showAuthRequiredToast, toastMessage } = useAuthRequiredToast();
  const meQuery = useMeQuery();
  const walletQuery = useWalletQuery({ enabled: Boolean(meQuery.data) });

  useEffect(() => {
    if (!isLoggingOutRef.current && !meQuery.isPending && !meQuery.isError && !meQuery.data) {
      showAuthRequiredToast();
    }
  }, [meQuery.data, meQuery.isError, meQuery.isPending, showAuthRequiredToast]);

  const nickname = meQuery.data?.nickname || "회원";
  const email = meQuery.data?.email || "";
  const profileImageSrc = meQuery.data?.profileImage?.trim() ? meQuery.data.profileImage : null;
  const joinDateText = meQuery.data?.joinDate ?? "-";
  const sinceText = `우리 뜨친된지 ${joinDateText}일 ♡`;

  const handleLogout = useCallback(async () => {
    isLoggingOutRef.current = true;

    try {
      await requestLogout();
    } finally {
      clearAccessToken();
      clearAuthenticatedQueryCache(queryClient);
      router.replace("/");
    }
  }, [queryClient, router]);

  const handleRetry = useCallback(() => {
    void meQuery.refetch();

    if (meQuery.data) {
      void walletQuery.refetch();
    }
  }, [meQuery, walletQuery]);

  const handleEditProfileClick = useCallback(() => {
    router.push("/my/edit");
  }, [router]);

  const handleMyActivityClick = useCallback(() => {
    router.push("/my/activity");
  }, [router]);

  const isLoading = meQuery.isPending || (Boolean(meQuery.data) && walletQuery.isPending);
  const isError = meQuery.isError || walletQuery.isError;
  const helpPageMenuItems = myHelpMenuItems.map((item) => ({
    label: item.title,
    href: item.href,
    external: "external" in item ? item.external : undefined,
  }));
  const creditGuideMenuItem = helpPageMenuItems[0];
  const inquiryMenuItem = helpPageMenuItems[1];
  const privacyPolicyMenuItem = helpPageMenuItems[2];
  const termsMenuItem = helpPageMenuItems[3];
  const withdrawalMenuItem = helpPageMenuItems[4];
  const eventMenuItems: MenuItem[] = [
    { label: "출석체크", href: "/events/attendance" },
    { label: "친구 초대/등록", href: "/my/friends" },
  ];
  const helpMenuItems: MenuItem[] = [
    { label: "UFO 가이드", href: "/onboarding" },
    creditGuideMenuItem,
    inquiryMenuItem,
    privacyPolicyMenuItem,
    termsMenuItem,
    { label: "로그아웃", onClick: handleLogout },
    withdrawalMenuItem,
  ];

  if (isLoading) {
    return (
      <>
        <MobileShell>
            <TopBar
              left="back"
              leftHref="/"
              title="마이페이지"
              right={[{ type: "home", href: "/", ariaLabel: "홈으로 이동" }]}
              showBottomBorder
            />
            <StateBlock type="loading" title="회원 정보를 불러오고 있어요." className="px-8 py-14" />
        </MobileShell>
        <ToastMessage message={toastMessage} />
      </>
    );
  }

  if (isError) {
    return (
      <>
        <MobileShell>
            <TopBar
              left="back"
              leftHref="/"
              title="마이페이지"
              right={[{ type: "home", href: "/", ariaLabel: "홈으로 이동" }]}
              showBottomBorder
            />
            <StateBlock
              type="error"
              title="회원 정보를 불러오지 못했어요."
              description="잠시 후 다시 시도하거나 새로고침해 주세요."
              actionLabel="다시 시도"
              onAction={handleRetry}
              className="px-8 py-14"
            />
        </MobileShell>
        <ToastMessage message={toastMessage} />
      </>
    );
  }

  if (!meQuery.data) {
    return (
      <>
        <MobileShell>
            <TopBar
              left="back"
              leftHref="/"
              title="마이페이지"
              right={[{ type: "home", href: "/", ariaLabel: "홈으로 이동" }]}
              showBottomBorder
            />
            <StateBlock type="loading" title="회원 정보를 불러오고 있어요." className="px-8 py-14" />
        </MobileShell>
        <ToastMessage message={toastMessage} />
      </>
    );
  }

  return (
    <>
      <MobileShell>
        <TopBar
          left="back"
          leftHref="/"
          title="마이페이지"
          right={[{ type: "home", href: "/", ariaLabel: "홈으로 이동" }]}
          showBottomBorder
        />

        <section className="px-8 py-9">
          <article className="rounded-2xl bg-ufo-brand px-4 py-4 text-white">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full bg-white/30 shadow-[0_2px_8px_rgba(0,0,0,0.16)]">
                  {profileImageSrc ? (
                    <Image
                      src={profileImageSrc}
                      loader={({ src }) => src}
                      unoptimized
                      width={56}
                      height={56}
                      alt={`${nickname} profile image`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-lg font-bold text-white/90">
                      {nickname.charAt(0)}
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-2xl font-bold leading-tight tracking-[-0.03em]">
                    안녕하세요! {nickname}님
                  </p>
                  <p className="pt-1 text-sm underline decoration-white/70 underline-offset-2">{email}</p>
                  <div className="flex flex-wrap items-center gap-2 pt-3">
                    <CreditBadge credits={walletQuery.data ?? 0} />
                    <Link
                      href="/my/credits"
                      className="inline-flex min-h-7 items-center rounded-full bg-white/20 px-3 text-[11px] font-semibold text-white"
                    >
                      사용 기록
                    </Link>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleEditProfileClick}
                className="flex h-8 w-8 items-center justify-center rounded-full"
                aria-label="프로필 수정"
              >
                <EditIcon className="h-[18px] w-[18px] text-white" />
              </button>
            </div>

            <div className="mt-3 flex items-center justify-between border-b border-white/70 pb-2 text-base font-medium tracking-[-0.02em]">
              <span>{sinceText}</span>
            </div>

            <button
              type="button"
              onClick={handleMyActivityClick}
              className="mt-3 w-full rounded-xl bg-ufo-brand-pale px-4 py-2 text-base font-semibold tracking-[-0.02em] text-ufo-text-neutral"
            >
              나의 활동 보기
            </button>
          </article>
        </section>

        <div className="space-y-2">
          <MenuSection title="이벤트" items={eventMenuItems} />
          <MenuSection title="도움말" items={helpMenuItems} />
        </div>
      </MobileShell>
      <ToastMessage message={toastMessage} />
    </>
  );
}
