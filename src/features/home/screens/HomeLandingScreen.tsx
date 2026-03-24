"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Footer from "@/components/common/Footer";
import MainTopSlider from "@/features/home/components/MainTopSlider";
import MainForYouSection from "@/features/home/components/MainForYouSection";
import NavBar from "@/components/navigation/NavBar";
import PatternCard from "@/components/patterns/PatternCard";
import SearchBar from "@/components/common/SearchBar";
import TopBar from "@/components/navigation/TopBar";
import { useAuthState } from "@/features/auth/hooks/useAuthState";
import {
  bestPatternsQueryOptions,
  newPatternsQueryOptions,
  recommendPatternsQueryOptions,
} from "@/features/home/queries/homeQueries";

type BannerItem = {
  id: number;
  title: string;
  count: string;
  href?: string;
  imageSrc?: string;
};



const bannerPosts: BannerItem[] = [
  { id: 1, title: "출석체크하고 매일매일 크레딧 받기", count: "1 / 5", href: "/events/attendance", imageSrc: "/image/attendance_banner.svg" },
  { id: 2, title: "감성 니팅 잡화를\n한눈에 모아보기", count: "2 / 5" },
  { id: 3, title: "요즘 인기 패턴을\n바로 확인하기", count: "3 / 5" },
  { id: 4, title: "취향 저격 도안을\n지금 찾아보기", count: "4 / 5" },
  { id: 5, title: "커뮤니티 추천 작품을\n둘러보기", count: "5 / 5" },
];

function EmptyPatternSection({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-ufo-border bg-white px-4 py-10 text-center text-sm text-ufo-text-secondary">
      {message}
    </div>
  );
}

export default function HomeLandingScreen() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const { authStatus, isAuthenticated, data: currentUser } = useAuthState();
  const profileHref = isAuthenticated ? "/my" : "/login";
  const authCacheKey = isAuthenticated
    ? currentUser?.userId ?? currentUser?.email ?? "member"
    : "guest";
  const bestPatternsQuery = useQuery(bestPatternsQueryOptions());
  const newPatternsQuery = useQuery(newPatternsQueryOptions());
  const recommendPatternsQuery = useQuery(recommendPatternsQueryOptions(authCacheKey));
  const bestItems = bestPatternsQuery.data ?? [];
  const newItems = newPatternsQuery.data ?? [];
  const recommendItems = recommendPatternsQuery.data ?? [];
  const handleSearchSubmit = () => {
    const keyword = query.trim();

    if (!keyword) {
      return;
    }

    router.push(`/patterns/search?keyword=${encodeURIComponent(keyword)}&page=1`);
  };

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
        <SearchBar
          value={query}
          onChange={setQuery}
          onSubmit={handleSearchSubmit}
          showSubmitButton
          submitDisabled={query.trim().length === 0}
        />
        <NavBar />
        <MainTopSlider posts={bannerPosts} />

        <section className="mb-6 px-4">
          <h2 className="mb-3 text-xl font-bold tracking-tight">BEST &gt;</h2>
          {bestItems.length > 0 ? (
            <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="flex w-max gap-4 pb-1">
                {bestItems.map((item) => (
                  <article key={item.id} className="w-[140px]">
                    <PatternCard
                      imageSrc={item.image}
                      imageRatio="1:1"
                      title={item.title}
                      author={item.author}
                      patternId={item.id}
                      heartVariant="outline"
                      heartClassName="h-5 w-5 stroke-white"
                    />
                  </article>
                ))}
              </div>
            </div>
          ) : (
            <EmptyPatternSection message="BEST 도안이 아직 없습니다." />
          )}
        </section>

        <MainForYouSection
          items={recommendItems}
          isAuthenticated={isAuthenticated}
          authStatus={authStatus}
          authCacheKey={authCacheKey}
        />

        <section className="px-4 pt-8">
          <h2 className="mb-4 text-xl font-bold tracking-tight">NEW</h2>
          {newItems.length > 0 ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-6">
              {newItems.map((item) => (
                <article key={item.id}>
                  <PatternCard
                    imageSrc={item.image}
                    imageRatio="1:1"
                    title={item.title}
                    author={item.author}
                    patternId={item.id}
                    heartVariant="outline"
                    heartClassName="h-5 w-5 stroke-white"
                  />
                </article>
              ))}
            </div>
          ) : (
            <EmptyPatternSection message="새 도안이 아직 없습니다." />
          )}
        </section>
        <Footer />
      </main>
    </div>
  );
}
