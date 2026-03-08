"use client";

import { useEffect, useState } from "react";
import Footer from "@/components/Footer";
import MainForYouSection from "@/components/MainForYouSection";
import MainTopSlider from "@/components/MainTopSlider";
import NavBar from "@/components/NavBar";
import PatternCard from "@/components/PatternCard";
import SearchBar from "@/components/SearchBar";
import TopBar from "@/components/TopBar";
import { useAuth } from "@/contexts/AuthContext";
import { fetchWithAuthRetry } from "@/lib/fetchWithAuthRetry";

type BestItem = {
  id: number;
  title: string;
  author: string;
  image: string;
};

type BestPatternApiItem = {
  id: number;
  title: string;
  thumbnailUrl: string | null;
  author: string;
};

type BestPatternsResponse = {
  data?: {
    items?: BestPatternApiItem[];
  };
  error?: unknown;
};

type CuratedItem = {
  id: number;
  title: string;
  author: string;
  image: string;
};

type RecommendApiItem = {
  id: number;
  title: string;
  thumbnailUrl: string | null;
  author: string;
};

type RecommendResponse = {
  data?: { items?: RecommendApiItem[] };
  error?: unknown;
};

type BannerItem = {
  id: number;
  title: string;
  count: string;
};



const bannerPosts: BannerItem[] = [
  { id: 1, title: "출석체크하고 매일매일 크레딧 받기", count: "1 / 5", href: "/events/attendance", imageSrc: "/image/attendance_banner.svg" },
  { id: 2, title: "감성 니팅 잡화를\n한눈에 모아보기", count: "2 / 5" },
  { id: 3, title: "요즘 인기 패턴을\n바로 확인하기", count: "3 / 5" },
  { id: 4, title: "취향 저격 도안을\n지금 찾아보기", count: "4 / 5" },
  { id: 5, title: "커뮤니티 추천 작품을\n둘러보기", count: "5 / 5" },
];

const fallbackBestItems: BestItem[] = [
  ...Array.from({ length: 5 }).map((_, index) => ({
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

const fallbackNewItems: BestItem[] = [
  {
    id: 1,
    title: "라인패치아노락(Line Patch)",
    author: "@da0_knit대금",
    image: "/mock/pattern-card.svg",
  },
  {
    id: 2,
    title: "라인패치아노락(Line Patch)",
    author: "@da0_knit대금",
    image: "/mock/pattern-card.svg",
  },
  {
    id: 3,
    title: "라인패치아노락(Line Patch)",
    author: "@da0_knit대금",
    image: "/mock/pattern-card.svg",
  },
  {
    id: 4,
    title: "라인패치아노락(Line Patch)",
    author: "@da0_knit대금",
    image: "/mock/pattern-card.svg",
  },
  {
    id: 5,
    title: "라인패치아노락(Line Patch)",
    author: "@da0_knit대금",
    image: "/mock/pattern-card.svg",
  },
  {
    id: 6,
    title: "라인패치아노락(Line Patch)",
    author: "@da0_knit대금",
    image: "/mock/pattern-card.svg",
  },
];

export default function Home() {
  const [query, setQuery] = useState("");
  const [bestItems, setBestItems] = useState<BestItem[]>(fallbackBestItems);
  const [newItems, setNewItems] = useState<BestItem[]>(fallbackNewItems);
  const [recommendItems, setRecommendItems] = useState<CuratedItem[]>(curatedItems);
  const { isAuthenticated, status } = useAuth();
  const profileHref = isAuthenticated ? "/my" : "/login";
  const apiBase = process.env.NEXT_PUBLIC_API_BASE ?? "/api";

  useEffect(() => {
    const controller = new AbortController();

    const fetchPatterns = async (sort: "views" | "news", limit: number) => {
      try {
        const params = new URLSearchParams({
          category: "all",
          sort,
          page: "1",
        });

        const response = await fetch(`${apiBase}/v1/patterns?${params.toString()}`, {
          method: "GET",
          signal: controller.signal,
        });

        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as BestPatternsResponse;
        if (payload.error || !payload.data || !Array.isArray(payload.data.items)) {
          return;
        }

        const mappedItems = payload.data.items
          .filter(
            (item): item is BestPatternApiItem =>
              typeof item.id === "number" &&
              typeof item.title === "string" &&
              typeof item.author === "string",
          )
          .map((item) => ({
            id: item.id,
            title: item.title,
            author: item.author,
            image: item.thumbnailUrl || "/mock/pattern-card.svg",
          }))
          .slice(0, limit);

        return mappedItems;
      } catch {
        return null;
      }
    };

    const fetchBestPatterns = async () => {
      const mappedItems = await fetchPatterns("views", 5);
      if (!mappedItems || mappedItems.length === 0) {
        return;
      }

      const completedItems = [
        ...mappedItems,
        ...fallbackBestItems.slice(0, Math.max(0, 5 - mappedItems.length)),
      ].slice(0, 5);

      setBestItems(completedItems);
    };

    const fetchNewPatterns = async () => {
      const mappedItems = await fetchPatterns("news", 10);
      if (!mappedItems || mappedItems.length === 0) {
        return;
      }

      const completedItems = [
        ...mappedItems,
        ...fallbackNewItems.slice(0, Math.max(0, 10 - mappedItems.length)),
      ].slice(0, 10);

      setNewItems(completedItems);
    };

    const fetchRecommendPatterns = async () => {
      try {
        const response = await fetchWithAuthRetry({
          apiBase,
          input: `${apiBase}/v1/patterns/recommend`,
          init: {
            method: "GET",
            signal: controller.signal,
          },
        });

        if (!response.ok) return;

        const payload = (await response.json()) as RecommendResponse;
        if (payload.error || !payload.data || !Array.isArray(payload.data.items)) return;

        const mapped = payload.data.items
          .filter(
            (item): item is RecommendApiItem =>
              typeof item.id === "number" &&
              typeof item.title === "string" &&
              typeof item.author === "string",
          )
          .map((item) => ({
            id: item.id,
            title: item.title,
            author: item.author,
            image: item.thumbnailUrl || "/mock/pattern-card.svg",
          }));

        if (mapped.length > 0) {
          setRecommendItems(mapped);
        }
      } catch {
        // Keep fallback items on error
      }
    };

    void fetchBestPatterns();
    void fetchNewPatterns();
    void fetchRecommendPatterns();

    return () => {
      controller.abort();
    };
  }, [apiBase]);

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
                    patternId={item.id}
                    heartVariant="outline"
                    heartClassName="h-5 w-5 stroke-white"
                  />
                </article>
              ))}
            </div>
          </div>
        </section>

        <MainForYouSection items={recommendItems} isAuthenticated={isAuthenticated} authStatus={status} />

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
                  patternId={item.id}
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
