"use client";

import { useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";
import CreditBadge from "@/components/credits/CreditBadge";
import EditIcon from "@/components/icons/EditIcon";
import TopBar from "@/components/navigation/TopBar";
import { useMeQuery } from "@/features/auth/hooks/useMeQuery";
import { useWalletQuery } from "@/features/auth/hooks/useWalletQuery";
import { clearAccessToken } from "@/lib/auth/accessToken";
import { fetchWithAuthRetry } from "@/lib/fetch/fetchWithAuthRetry";
import { userQueryKeys } from "@/features/auth/queries/userQueries";
import { buildApiUrl } from "@/lib/api/client";

type MenuItem = {
  label: string;
  onClick?: () => void | Promise<void>;
};

function MenuSection({ title, items }: { title: string; items: MenuItem[] }) {
  return (
    <section>
      <h2 className="ml-8 pb-2 text-md font-medium text-ufo-text-muted">{title}</h2>
      <div className="border-t border-ufo-border py-4">
      <ul className="space-y-3 text-lg leading-[1.15] tracking-[-0.02em] text-ufo-text-subtle ml-10">
        {items.map((item) => (
          <li key={item.label}>
            {item.onClick ? (
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
  const joinDateText = meQuery.data?.joinDate ?? "-";
  const sinceText = `우리 뜨친된지 ${joinDateText}일 ♡`;

  const handleLogout = useCallback(async () => {
    try {
      await fetchWithAuthRetry({
        input: buildApiUrl("/v1/auth/logout"),
        init: {
          method: "POST",
        },
      });
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

  const handleAttendanceClick = useCallback(() => {
    router.push("/events/attendance");
  }, [router]);

  const handleEditProfileClick = useCallback(() => {
    router.push("/my/edit");
  }, [router]);

  const handleMyActivityClick = useCallback(() => {
    router.push("/my/activity");
  }, [router]);

  const isLoading = meQuery.isPending || (Boolean(meQuery.data) && walletQuery.isPending);
  const isError = meQuery.isError || walletQuery.isError;
  const helpMenuItems: MenuItem[] = [
    { label: "FAQ" },
    { label: "공지사항" },
    { label: "출석체크", onClick: handleAttendanceClick },
    { label: "1:1 문의" },
    { label: "주문 조회" },
    { label: "개인정보 처리방침" },
    { label: "서비스 이용약관" },
    { label: "로그아웃", onClick: handleLogout },
    { label: "회원탈퇴" },
  ];

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
                onClick={handleEditProfileClick}
                className="flex h-8 w-8 items-center justify-center rounded-full"
                aria-label="프로필 수정"
              >
                <EditIcon className="h-[18px] w-[18px] text-white" />
              </button>
            </div>

            <div className="mt-3 flex items-center justify-between border-b border-white/70 pb-2 text-l font-medium tracking-[-0.02em]">
              <span>{sinceText}</span>
            </div>

            <button
              type="button"
              onClick={handleMyActivityClick}
              className="mt-3 w-full rounded-xl bg-ufo-brand-pale px-4 py-2 text-l font-semibold tracking-[-0.02em] text-ufo-text-neutral"
            >
              나의 활동 보기
            </button>
          </article>
        </section>

        <MenuSection title="도움말" items={helpMenuItems} />
      </main>
    </div>
  );
}
