"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Footer from "@/components/common/Footer";
import StateBlock from "@/components/common/StateBlock";
import MobileShell from "@/components/layout/MobileShell";
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
  { id: 2, title: "크레딧, 알고 쓰면 더 즐거워요", count: "2 / 6", href: "/my/help/credits", imageSrc: "/image/credit_guide_banner.svg" },
  { id: 3, title: "감성 니팅 잡화를\n한눈에 모아보기", count: "3 / 6" },
  { id: 4, title: "요즘 인기 패턴을\n바로 확인하기", count: "4 / 6" },
  { id: 5, title: "취향 저격 도안을\n지금 찾아보기", count: "5 / 6" },
  { id: 6, title: "커뮤니티 추천 작품을\n둘러보기", count: "6 / 6" },
];

function EmptyPatternSection({ message }: { message: string }) {
  return <StateBlock type="empty" title={message} className="px-0 py-0" />;
}

export default function HomeLandingScreen() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const { authStatus, isAuthenticated, data: currentUser } = useAuthState();
  const profileHref = isAuthenticated ? "/my" : "/login";
  const authCacheKey = isAuthenticated
    ? currentUser?.userId ?? currentUser?.email ?? "member"
    : "guest";
  const bestPatternsQuery = useQuery({
    ...bestPatternsQueryOptions(authCacheKey),
    enabled: authStatus !== "loading",
  });
  const newPatternsQuery = useQuery({
    ...newPatternsQueryOptions(authCacheKey),
    enabled: authStatus !== "loading",
  });
  const recommendPatternsQuery = useQuery({
    ...recommendPatternsQueryOptions(authCacheKey),
    enabled: authStatus !== "loading",
  });
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
    <MobileShell surfaceClassName="pb-10">
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
          <h2 className="mb-3 text-xl font-bold tracking-tight">BEST</h2>
          {bestItems.length > 0 ? (
            <div className="-mx-4 overflow-x-auto px-4 pb-2 [scrollbar-color:var(--color-ufo-text-muted)_var(--color-ufo-surface)] [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-ufo-text-muted [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-ufo-surface">
              <div className="flex w-max gap-4 pb-1">
                {bestItems.map((item) => (
                  <article key={item.id} className="w-[140px]">
                    <PatternCard
                      imageSrc={item.image}
                      imageRatio="1:1"
                      imageSizes="140px"
                      title={item.title}
                      author={item.author}
                      patternId={item.id}
                      isScrapped={item.isScrapped}
                      heartVariant="outline"
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
                    isScrapped={item.isScrapped}
                    heartVariant="outline"
                  />
                </article>
              ))}
            </div>
          ) : (
            <EmptyPatternSection message="새 도안이 아직 없습니다." />
          )}
        </section>
        <Footer />
    </MobileShell>
  );
}
