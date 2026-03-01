"use client";

import { useState } from "react";
import Footer from "@/components/Footer";
import MainForYouSection from "@/components/MainForYouSection";
import MainTopSlider from "@/components/MainTopSlider";
import NavBar from "@/components/NavBar";
import PatternCard from "@/components/PatternCard";
import SearchBar from "@/components/SearchBar";
import TopBar from "@/components/TopBar";
import { useAuth } from "@/contexts/AuthContext";

type BestItem = {
  id: number;
  title: string;
  author: string;
  image: string;
};

type CuratedItem = {
  id: number;
  title: string;
  author: string;
  image: string;
};

type BannerItem = {
  id: number;
  title: string;
  count: string;
};



const bannerPosts: BannerItem[] = [
  { id: 1, title: "일본 편집숍을\n한 공간에서 만난다면?", count: "1 / 5" },
  { id: 2, title: "감성 니팅 잡화를\n한눈에 모아보기", count: "2 / 5" },
  { id: 3, title: "요즘 인기 패턴을\n바로 확인하기", count: "3 / 5" },
  { id: 4, title: "취향 저격 도안을\n지금 찾아보기", count: "4 / 5" },
  { id: 5, title: "커뮤니티 추천 작품을\n둘러보기", count: "5 / 5" },
];

const bestItems: BestItem[] = [
  ...Array.from({ length: 10 }).map((_, index) => ({
    id: index + 1,
    title: "라인패치아노락(Line Patch)",
    author: "@da0_knit대금",
    image: "/mock/pattern-card.svg",
  })),
];

const curatedItems: CuratedItem[] = [
  ...Array.from({ length: 5 }).map((_, index) => ({
    id: index + 1,
    title: index % 2 === 0 ? "손둥이 무설탕 토끼인형" : "(대바늘) 뜨강아지",
    author: "@da0_knit대금",
    image: index % 2 === 0 ? "/mock/plush-pink.svg" : "/mock/plush-white.svg",
  })),
];

const newItems: BestItem[] = [
  {
    id: 1,
    title: "라인패치아노#(Line Patch)",
    author: "@da0_knit대금",
    image: "/mock/pattern-card.svg",
  },
  {
    id: 2,
    title: "라인패치아노#(Line Patch)",
    author: "@da0_knit대금",
    image: "/mock/pattern-card.svg",
  },
  {
    id: 3,
    title: "라인패치아노#(Line Patch)",
    author: "@da0_knit대금",
    image: "/mock/pattern-card.svg",
  },
  {
    id: 4,
    title: "라인패치아노#(Line Patch)",
    author: "@da0_knit대금",
    image: "/mock/pattern-card.svg",
  },
  {
    id: 5,
    title: "라인패치아노#(Line Patch)",
    author: "@da0_knit대금",
    image: "/mock/pattern-card.svg",
  },
  {
    id: 6,
    title: "라인패치아노#(Line Patch)",
    author: "@da0_knit대금",
    image: "/mock/pattern-card.svg",
  },
];

export default function Home() {
  const [query, setQuery] = useState("");
  const { isAuthenticated, status } = useAuth();
  const profileHref = isAuthenticated ? "/my" : "/login";

  return (
    <div className="min-h-screen bg-[#ececec]">
      <main className="mx-auto min-h-screen w-full max-w-[430px] bg-[#ffffff] pb-10 text-[#1f1f1f]">
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
        <MainTopSlider posts={bannerPosts} />

        <section className="mb-6 px-4">
          <h2 className="mb-3 text-xl font-bold tracking-tight">BEST &gt;</h2>
          <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex w-max gap-4 pb-1">
              {bestItems.map((item) => (
                <article key={item.id} className="w-[140px]">
                  <PatternCard
                    imageSrc={item.image}
                    imageRatio="1:1"
                    title={item.title}
                    author={item.author}
                    heartVariant="outline"
                    heartClassName="h-5 w-5 stroke-white"
                  />
                </article>
              ))}
            </div>
          </div>
        </section>

        <MainForYouSection items={curatedItems} isAuthenticated={isAuthenticated} authStatus={status} />

        <section className="px-4 pt-8">
          <h2 className="mb-4 text-xl font-bold tracking-tight">NEW</h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-6">
            {newItems.map((item) => (
              <article key={item.id}>
                <PatternCard
                  imageSrc={item.image}
                  imageRatio="1:1"
                  title={item.title}
                  author={item.author}
                  heartVariant="outline"
                  heartClassName="h-5 w-5 stroke-white"
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
