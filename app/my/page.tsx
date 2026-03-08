"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import CreditBadge from "@/components/CreditBadge";
import TopBar from "@/components/TopBar";
import { useAuth } from "@/contexts/AuthContext";
import { fetchWithAuthRetry } from "@/lib/fetchWithAuthRetry";

const profile = {
  sinceText: "우리 뜨친된지 199일 ♡",
};

const helpMenuItems = ["내가 작성한 글", "내가 작성한 댓글", "고객센터", "공지사항", "1:1 문의"];
const accountMenuItems = ["주문 조회"];
const policyMenuItems = ["개인정보 처리방침", "서비스 이용약관", "위치기반서비스 이용약관"];
const userMenuItems = ["로그아웃", "회원탈퇴"];

function EditIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M14.7 5.3L18.7 9.3M7 17L6 21L10 20L19.4 10.6C20.2 9.8 20.2 8.5 19.4 7.7L16.3 4.6C15.5 3.8 14.2 3.8 13.4 4.6L7 11V17Z"
        stroke="#FFFFFF"
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

export default function MyPage() {
  const router = useRouter();
  const { clearAuth, userProfile, creditBalance } = useAuth();
  const nickname = userProfile?.nickname || "회원";
  const email = userProfile?.email || "";
  const profileImageSrc = userProfile?.profileImage?.trim() ? userProfile.profileImage : null;

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
      clearAuth();
      router.replace("/login");
    }
  }, [clearAuth, router]);

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
          <article className="rounded-2xl bg-[#ee9f9f] px-4 py-4 text-white">
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
                    <CreditBadge
                      credits={creditBalance ?? 0}
                      badgeColor="#39d2f0"
                      circleColor="#ffffff"
                      starColor="#39d2f0"
                      textColor="#ffffff"
                    />
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
              className="mt-3 w-full rounded-xl bg-[#f3ece8] px-4 py-2 text-l font-semibold tracking-[-0.02em] text-[#888888]"
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
