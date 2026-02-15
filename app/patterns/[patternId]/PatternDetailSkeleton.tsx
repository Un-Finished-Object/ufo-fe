"use client";

import Image from "next/image";
import { useState } from "react";
import TopBar from "@/components/TopBar";

type PatternDetailData = {
  id: string;
  title: string;
  author: string;
  credits: number;
  image: string;
};

type PatternDetailSkeletonProps = {
  pattern: PatternDetailData;
};

function HeartIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-6 w-6 fill-none stroke-[#e98f9b]"
      strokeWidth="2"
    >
      <path d="M12.1 20.7c-.1.1-.3.1-.4 0-5-4.5-8.2-7.4-8.2-11A4.9 4.9 0 0 1 8.4 4.8c1.5 0 2.9.7 3.8 1.8.9-1.1 2.3-1.8 3.8-1.8a4.9 4.9 0 0 1 4.9 4.9c0 3.6-3.2 6.5-8.2 11Z" />
    </svg>
  );
}

export default function PatternDetailSkeleton({
  pattern,
}: PatternDetailSkeletonProps) {
  const [activeTab, setActiveTab] = useState<"description" | "alternative">(
    "description",
  );

  return (
    <div className="min-h-screen bg-[#ececec]">
      <main className="mx-auto min-h-screen w-full max-w-[430px] bg-[#ffffff] pb-28 text-[#1f1f1f]">
        <TopBar />

        <section className="px-4 pt-3">
          <div className="relative mb-4 aspect-[4/3] w-full overflow-hidden rounded-2xl">
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
          <article className="rounded-2xl border border-[#dcdcdc] bg-white p-4">
            <h2 className="text-sm font-bold text-[#2f2f2f]">실시간 채팅방</h2>

            <div className="mt-3 flex -space-x-2">
              {[1, 2, 3, 4].map((id) => (
                <div
                  key={id}
                  className="h-7 w-7 rounded-full border-2 border-white bg-[#f3c5cc]"
                />
              ))}
            </div>

            <div className="mt-4 space-y-2">
              <div className="h-2.5 w-3/4 rounded-full bg-[#ececec]" />
              <div className="h-2.5 w-2/3 rounded-full bg-[#ececec]" />
            </div>

            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs font-semibold text-[#888]">
                입장 비용 {pattern.credits} 크레딧
              </span>
              <button
                type="button"
                className="rounded-lg bg-[#ec9ca5] px-3 py-2 text-xs font-bold text-white"
              >
                채팅방 입장하기
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
              도안설명
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

          <div className="mt-4 rounded-xl bg-white p-4 text-sm text-[#666]">
            {activeTab === "description" ? (
              <p>
                도안 설명 영역 (UI 스켈레톤)
                <br />
                사이즈, 난이도, 사용 바늘/실 정보 등이 들어갈 예정입니다.
              </p>
            ) : (
              <p>
                대체실 정보 영역 (UI 스켈레톤)
                <br />
                실 대체 추천 목록과 게이지 참고 정보가 들어갈 예정입니다.
              </p>
            )}
          </div>
        </section>

        <section className="mt-6 px-4 pb-4 text-xs text-[#9a9a9a]">
          patternId: {pattern.id}
        </section>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-50 bg-[#ffffff]/95 py-3">
        <div className="mx-auto flex w-full max-w-[430px] items-center gap-3 px-4">
          <button
            type="button"
            className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#efc2c9]"
            aria-label="찜하기"
          >
            <HeartIcon />
          </button>
          <button
            type="button"
            className="flex h-12 flex-1 items-center justify-center rounded-xl bg-[#ec9ca5] text-sm font-bold text-white"
          >
            구매하기 · {pattern.credits} 크레딧
          </button>
        </div>
      </div>
    </div>
  );
}
