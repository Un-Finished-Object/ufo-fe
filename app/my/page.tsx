"use client";

import { useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";
import CreditBadge from "@/components/CreditBadge";
import TopBar from "@/components/TopBar";
import { useMeQuery } from "@/hooks/queries/useMeQuery";
import { useWalletQuery } from "@/hooks/queries/useWalletQuery";
import { clearAccessToken } from "@/lib/auth/accessToken";
import { fetchWithAuthRetry } from "@/lib/fetchWithAuthRetry";
import { userQueryKeys } from "@/lib/queries/user";

const profile = {
  sinceText: "우리 뜨친된지 199일 ♡",
};

const helpMenuItems = ["내가 작성한 글", "내가 작성한 댓글", "고객센터", "공지사항", "1:1 문의"];
const accountMenuItems = ["주문 조회"];
const policyMenuItems = ["개인정보 처리방침", "서비스 이용약관", "위치기반서비스 이용약관"];
const userMenuItems = ["로그아웃", "회원탈퇴"];

function EditIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-white" aria-hidden="true">
      <path
        d="M14.7 5.3L18.7 9.3M7 17L6 21L10 20L19.4 10.6C20.2 9.8 20.2 8.5 19.4 7.7L16.3 4.6C15.5 3.8 14.2 3.8 13.4 4.6L7 11V17Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MenuSection({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="border-t border-ufo-border px-6 py-4">
      <h2 className="pb-3 text-lg font-medium text-ufo-text-muted">{title}</h2>
      <ul className="space-y-3 text-[31px] leading-[1.15] tracking-[-0.02em] text-ufo-text-subtle">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

function LoadingState() {
  return (
    <section className="px-8 py-14">
      <div className="flex flex-col items-center justify-center rounded-2xl border border-ufo-border bg-white px-6 py-12 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-ufo-border-light border-t-ufo-brand-pale" />
        <p className="mt-4 text-sm font-medium text-ufo-text-secondary">
          회원 정보를 불러오고 있어요.
        </p>
      </div>
    </section>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <section className="px-8 py-14">
      <div className="rounded-2xl border border-ufo-border bg-white px-6 py-10 text-center">
        <p className="text-base font-semibold text-ufo-text">회원 정보를 불러오지 못했어요.</p>
        <p className="mt-2 text-sm text-ufo-text-secondary">
          잠시 후 다시 시도하거나 새로고침해 주세요.
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-5 rounded-xl bg-ufo-brand-soft px-4 py-2 text-sm font-semibold text-white"
        >
          다시 시도
        </button>
      </div>
    </section>
  );
}

export default function MyPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const meQuery = useMeQuery();
  const walletQuery = useWalletQuery({ enabled: Boolean(meQuery.data) });

  useEffect(() => {
    if (!meQuery.isPending && !meQuery.isError && !meQuery.data) {
      router.replace("/login?error=unauthorized");
    }
  }, [meQuery.data, meQuery.isError, meQuery.isPending, router]);

  const nickname = meQuery.data?.nickname || "회원";
  const email = meQuery.data?.email || "";
  const profileImageSrc = meQuery.data?.profileImage?.trim() ? meQuery.data.profileImage : null;

  const handleLogout = useCallback(async () => {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE;

    try {
      if (apiBase) {
        await fetchWithAuthRetry({
          apiBase,
          input: `${apiBase}/v1/auth/logout`,
          init: {
            method: "POST",
          },
        });
      }
    } finally {
      clearAccessToken();
      queryClient.setQueryData(userQueryKeys.me, null);
      queryClient.setQueryData(userQueryKeys.wallet, null);
      router.replace("/login");
    }
  }, [queryClient, router]);

  const handleRetry = useCallback(() => {
    void meQuery.refetch();

    if (meQuery.data) {
      void walletQuery.refetch();
    }
  }, [meQuery, walletQuery]);

  const isLoading = meQuery.isPending || (Boolean(meQuery.data) && walletQuery.isPending);
  const isError = meQuery.isError || walletQuery.isError;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-ufo-bg">
        <main className="mx-auto min-h-screen w-full max-w-[430px] bg-ufo-surface">
          <TopBar
            left="back"
            leftHref="/"
            title="마이페이지"
            right={[{ type: "home", href: "/", ariaLabel: "홈으로 이동" }]}
            showBottomBorder
          />
          <LoadingState />
        </main>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-ufo-bg">
        <main className="mx-auto min-h-screen w-full max-w-[430px] bg-ufo-surface">
          <TopBar
            left="back"
            leftHref="/"
            title="마이페이지"
            right={[{ type: "home", href: "/", ariaLabel: "홈으로 이동" }]}
            showBottomBorder
          />
          <ErrorState onRetry={handleRetry} />
        </main>
      </div>
    );
  }

  if (!meQuery.data) {
    return (
      <div className="min-h-screen bg-ufo-bg">
        <main className="mx-auto min-h-screen w-full max-w-[430px] bg-ufo-surface">
          <TopBar
            left="back"
            leftHref="/"
            title="마이페이지"
            right={[{ type: "home", href: "/", ariaLabel: "홈으로 이동" }]}
            showBottomBorder
          />
          <LoadingState />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ufo-bg">
      <main className="mx-auto min-h-screen w-full max-w-[430px] bg-ufo-surface">
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
                  <div className="pt-3">
                    <CreditBadge credits={walletQuery.data ?? 0} />
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-full"
                aria-label="프로필 수정"
              >
                <EditIcon />
              </button>
            </div>

            <div className="mt-3 flex items-center justify-between border-b border-white/70 pb-2 text-l font-medium tracking-[-0.02em]">
              <span>{profile.sinceText}</span>
              <span aria-hidden="true">&gt;</span>
            </div>

            <button
              type="button"
              className="mt-3 w-full rounded-xl bg-ufo-brand-pale px-4 py-2 text-l font-semibold tracking-[-0.02em] text-ufo-text-neutral"
            >
              내가 구매한 대체실 정보 보기
            </button>
          </article>
        </section>

        <MenuSection title="도움말" items={helpMenuItems} />
        <MenuSection title="계정 관리" items={accountMenuItems} />
        <section className="border-t border-ufo-border px-6 py-4">
          <ul className="space-y-3 text-[31px] leading-[1.15] tracking-[-0.02em] text-ufo-text-subtle">
            {policyMenuItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
        <section className="border-t border-ufo-border px-6 py-4 pb-16">
          <ul className="space-y-3 text-[31px] leading-[1.15] tracking-[-0.02em] text-ufo-text-subtle">
            {userMenuItems.map((item) => (
              <li key={item}>
                {item === "로그아웃" ? (
                  <button type="button" onClick={handleLogout} className="text-inherit">
                    {item}
                  </button>
                ) : (
                  item
                )}
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
