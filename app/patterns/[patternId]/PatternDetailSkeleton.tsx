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
          <div className="relative mb-4 aspect-[4/3] w-full overflow-hidden">
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
          <article className="rounded-2xl border border-[#ffaba6] bg-white p-4">
            <h2 className="text-sm font-bold text-[#6c6c6c]">{chatRoomTitle}</h2>

            <div className="mt-3 flex -space-x-2">
              {[1, 2, 3, 4].map((id) => (
                <div
                  key={id}
                  className={`h-7 w-7 rounded-full border-2 border-white ${
                    pattern.hasPurchased ? "bg-[#f3c5cc]" : "bg-[#f5f5f5]"
                  } ${pattern.hasPurchased ? "" : "opacity-0"}`}
                />
              ))}
            </div>

            <div className="mt-4 space-y-2">
              {pattern.hasPurchased ? (
                <>
                  <div className="h-2.5 w-3/4 rounded-full bg-[#ececec]" />
                  <div className="h-2.5 w-2/3 rounded-full bg-[#ececec]" />
                </>
              ) : (
                <>
                  <div className="h-2.5 w-3/4 rounded-full bg-[#ececec] opacity-0" />
                  <div className="h-2.5 w-2/3 rounded-full bg-[#ececec] opacity-0" />
                </>
              )}
            </div>

            <div className="mt-4">
              <button
                type="button"
                className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-[#ffa8a8] bg-[#fff1ed] px-3 text-sm font-bold text-[#777777]"
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
              <div className="overflow-hidden border">
                {detailRows.map((row) => (
                  <div
                    key={row.key}
                    className="grid grid-cols-[104px_1fr] border-b bg-[#ffe5e5] last:border-b-0"
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
