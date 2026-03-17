'use client';

import { useState } from "react";
import Footer from "@/components/Footer";
import TopBar from "@/components/TopBar";
import SearchBar from "@/components/SearchBar";
import NavBar from "@/components/NavBar";
import PatternCard from "@/components/PatternCard";
import SegmentedSwitch from "@/components/SegmentedSwitch";
import { useAuthState } from "@/hooks/useAuthState";

type ScrapTab = "pattern" | "style";

type ScrapItem = {
  id: number;
  title: string;
  author: string;
  image: string;
};

const patternScraps: ScrapItem[] = [
  { id: 1, title: "라인패치아노락(Line Patch)", author: "@da0_knit대금", image: "/mock/pattern-card.svg" },
  { id: 2, title: "보들보들 탑다운 가디건", author: "@daily_knit", image: "/mock/pattern-card.svg" },
  { id: 3, title: "로맨틱 레이스 베스트", author: "@ufo_knits", image: "/mock/pattern-card.svg" },
  { id: 4, title: "클래식 스트라이프 니트", author: "@needle_day", image: "/mock/pattern-card.svg" },
  { id: 5, title: "봄날 코튼 풀오버", author: "@cotton_loop", image: "/mock/pattern-card.svg" },
  { id: 6, title: "포근한 윈터 머플러", author: "@wool_mood", image: "/mock/pattern-card.svg" },
  { id: 7, title: "하트 포인트 스웨터", author: "@pink_stitch", image: "/mock/pattern-card.svg" },
  { id: 8, title: "레이어드 니트 조끼", author: "@soft_studio", image: "/mock/pattern-card.svg" },
  { id: 9, title: "모던 크롭 카디건", author: "@urban_loop", image: "/mock/pattern-card.svg" },
];

const styleScraps: ScrapItem[] = [
  { id: 1, title: "아이보리 톤온톤 코디", author: "@style_knitter", image: "/mock/pattern-card.svg" },
  { id: 2, title: "핑크 포인트 니팅룩", author: "@knit_daily", image: "/mock/pattern-card.svg" },
  { id: 3, title: "모노톤 겨울 룩북", author: "@ufo_style", image: "/mock/pattern-card.svg" },
  { id: 4, title: "라이트 베이지 레이어드", author: "@loop_and_love", image: "/mock/pattern-card.svg" },
  { id: 5, title: "데님 매치 데일리 니트", author: "@stitch_style", image: "/mock/pattern-card.svg" },
  { id: 6, title: "니트 베스트 출근룩", author: "@knit_cloud", image: "/mock/pattern-card.svg" },
  { id: 7, title: "봄 컬러 카드 가디건룩", author: "@color_stitch", image: "/mock/pattern-card.svg" },
  { id: 8, title: "미니멀 블랙 니팅핏", author: "@mono_knitter", image: "/mock/pattern-card.svg" },
  { id: 9, title: "클래식 케이블 니트룩", author: "@cable_day", image: "/mock/pattern-card.svg" },
];

const scrapTabOptions = [
  { label: "도안 찜", value: "pattern" },
  { label: "스타일 찜", value: "style" },
] as const;

export default function ScrapsMainPage() {
  const [query, setQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState<ScrapTab>("pattern");
  const { isAuthenticated } = useAuthState();
  const profileHref = isAuthenticated ? "/my" : "/login";
  const items = selectedTab === "pattern" ? patternScraps : styleScraps;

  return (
    <div className="min-h-screen bg-ufo-bg">
      <main className="mx-auto min-h-screen w-full max-w-[430px] bg-ufo-surface pb-10 text-ufo-text">
        <TopBar
          left="logo"
          leftHref="/"
          right={[
            { type: "chat", href: "/chats", ariaLabel: "채팅" },
            { type: "profile", href: profileHref, ariaLabel: "프로필" },
          ]}
        />
        <SearchBar value={query} onChange={setQuery} />
        <NavBar />

        <section className="px-4 pt-3">
          <SegmentedSwitch
            options={scrapTabOptions}
            value={selectedTab}
            onChange={setSelectedTab}
          />
        </section>

        <section className="px-4 pt-5">
          <div className="grid grid-cols-3 gap-x-3 gap-y-6">
            {items.map((item) => (
              <article key={`${selectedTab}-${item.id}`}>
                <PatternCard
                  imageSrc={item.image}
                  imageRatio="4:5"
                  title={item.title}
                  author={item.author}
                  patternId={item.id}
                  heartVariant="filled"
                  heartClassName="h-5 w-5 stroke-white fill-white"
                  titleClassName="truncate text-[11px] font-semibold leading-tight"
                  authorClassName="text-[9px] text-ufo-text-neutral"
                />
              </article>
            ))}
          </div>
        </section>
        <Footer />
      </main>
    </div>
  );
}
