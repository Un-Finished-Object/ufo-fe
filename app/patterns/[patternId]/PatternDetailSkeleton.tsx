"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import PatternPurchaseBar from "@/components/PatternPurchaseBar";
import TopBar from "@/components/TopBar";
import { useAuth } from "@/contexts/AuthContext";

type PatternDetailData = {
  id: string;
  title: string;
  author: string;
  credits: number;
  image: string;
  hasPurchased: boolean;
  details: {
    category: string;
    size: string;
    measurement: string;
    needle: string;
    yarn: string;
    amount: string;
    gauge: string;
  };
};

type PatternDetailSkeletonProps = {
  pattern: PatternDetailData;
};

const detailRows = [
  { label: "카테고리", key: "category" },
  { label: "사이즈", key: "size" },
  { label: "실측", key: "measurement" },
  { label: "사용바늘", key: "needle" },
  { label: "원작실", key: "yarn" },
  { label: "소요량", key: "amount" },
  { label: "게이지", key: "gauge" },
] as const;

function CreditBadge({ credits }: { credits: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#59cbe5]">
      <span className="inline-block h-3 w-3 rounded-full bg-[#59cbe5]" />
      {credits} 크레딧
    </span>
  );
}

export default function PatternDetailSkeleton({
  pattern,
}: PatternDetailSkeletonProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<"description" | "alternative">("description");
  const profileHref = isAuthenticated ? "/mypage" : "/login";
  const chatRoomTitle = `${pattern.title} 실시간 채팅방`;

  return (
    <div className="min-h-screen bg-[#ececec]">
      <main className="mx-auto min-h-screen w-full max-w-[430px] bg-[#ffffff] pb-28 text-[#1f1f1f]">
        <TopBar
          left="back"
          onLeftClick={() => router.back()}
          showBottomBorder
          right={[
            { type: "chat", href: "/chats", ariaLabel: "채팅" },
            { type: "profile", href: profileHref, ariaLabel: "프로필" },
          ]}
        />

        <section>
          <div className="relative mb-4 aspect-[5/4] w-full overflow-hidden">
            <Image
              src={pattern.image}
              alt={`${pattern.title} hero image`}
              fill
              className="object-cover"
            />
          </div>
        </section>

        <section className="px-4">
          <h1 className="text-xl font-black tracking-tight">{pattern.title}</h1>
          <p className="mt-1 text-sm font-medium text-[#858585]">{pattern.author}</p>
        </section>

        <section className="mt-5 px-4">
          <article className="flex h-[184px] flex-col rounded-2xl border border-[#ffaba6] bg-white p-4">
            <div className="flex items-center gap-2 border-b border-[#ebebeb] pb-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="text-[#8c8c8c] bi bi-chat-right-text" viewBox="0 0 16 16">
              <path d="M2 1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h9.586a2 2 0 0 1 1.414.586l2 2V2a1 1 0 0 0-1-1zm12-1a2 2 0 0 1 2 2v12.793a.5.5 0 0 1-.854.353l-2.853-2.853a1 1 0 0 0-.707-.293H2a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2z"/>
              <path d="M3 3.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5M3 6a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9A.5.5 0 0 1 3 6m0 2.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5"/>
            </svg>
              <h2 className="truncate text-sm text-[#8c8c8c]">{chatRoomTitle}</h2>
            </div>

            <div className="mt-3">
              <div
                className="max-h-[72px] space-y-3 overflow-y-auto"
                aria-label="실시간 채팅 미리보기"
              >
                <div className="flex items-center gap-2">
                  <span className="h-9 w-9 rounded-full bg-[#f2e8e5]" aria-hidden="true" />
                  <span className="h-7 w-[132px] rounded-xl bg-[#d9d9d9]" aria-hidden="true" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-9 w-9 rounded-full bg-[#ffb7b2]" aria-hidden="true" />
                  <span className="h-7 w-[132px] rounded-xl bg-[#d9d9d9]" aria-hidden="true" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-9 w-9 rounded-full bg-[#f2e8e5]" aria-hidden="true" />
                  <span className="h-7 w-[120px] rounded-xl bg-[#d9d9d9]" aria-hidden="true" />
                </div>
              </div>
            </div>

            <div className="mt-3">
              <button
                type="button"
                className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-[#ffb3ae] bg-[#f9eeea] px-3 text-sm font-bold text-[#777777]"
              >
                {pattern.hasPurchased ? "채팅방 참여하기" : "채팅방 입장하기"}
                {pattern.hasPurchased ? null : <CreditBadge credits={pattern.credits} />}
              </button>
            </div>
          </article>
        </section>

        <section className="mt-6 px-4">
          <div className="flex border-b border-[#dddddd]">
            <button
              type="button"
              onClick={() => setActiveTab("description")}
              className={`relative flex-1 pb-3 text-sm font-semibold ${
                activeTab === "description" ? "text-[#ec9ca5]" : "text-[#888]"
              }`}
            >
              상세정보
              {activeTab === "description" ? (
                <span className="absolute left-1/2 -bottom-px h-[2px] w-16 -translate-x-1/2 bg-[#ec9ca5]" />
              ) : null}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("alternative")}
              className={`relative flex-1 pb-3 text-sm font-semibold ${
                activeTab === "alternative" ? "text-[#ec9ca5]" : "text-[#888]"
              }`}
            >
              대체실정보
              {activeTab === "alternative" ? (
                <span className="absolute left-1/2 -bottom-px h-[2px] w-16 -translate-x-1/2 bg-[#ec9ca5]" />
              ) : null}
            </button>
          </div>

          <div className="mt-4">
            {activeTab === "description" ? (
              <div className="overflow-hidden border-b">
                {detailRows.map((row) => (
                  <div
                    key={row.key}
                    className="grid grid-cols-[104px_1fr] border-t bg-[#ffe5e5] last:border-b-0"
                  >
                    <div className="flex min-h-[52px] items-center px-4 text-sm font-bold text-[#555]">
                      {row.label}
                    </div>
                    <div className="flex min-h-[52px] items-center justify-end px-4 text-sm font-semibold text-[#9a9a9a]">
                      {pattern.details[row.key]}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl bg-[#f5e5e5] p-4 text-sm text-[#7e7e7e]">
                대체실정보는 추후 API 연동 후 제공될 예정입니다.
              </div>
            )}
          </div>
        </section>

        <section className="mt-6 px-4 pb-4 text-xs text-[#9a9a9a]">
          patternId: {pattern.id}
        </section>
      </main>

      <PatternPurchaseBar credits={pattern.credits} />
    </div>
  );
}
