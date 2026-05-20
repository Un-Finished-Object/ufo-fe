"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import Footer from "@/components/common/Footer";
import ToastMessage from "@/components/common/ToastMessage";
import TopBar from "@/components/navigation/TopBar";
import SearchBar from "@/components/common/SearchBar";
import NavBar from "@/components/navigation/NavBar";
import PatternCard from "@/components/patterns/PatternCard";
import SegmentedSwitch from "@/components/common/SegmentedSwitch";
import { useAuthState } from "@/features/auth/hooks/useAuthState";
import {
  fetchPatternScraps,
  type PatternScrapItem,
} from "@/features/scraps/services/fetchPatternScraps";
import { fetchStyleScraps, type StyleScrapItem } from "@/features/scraps/services/fetchStyleScraps";
import { useAuthRequiredToast } from "@/hooks/useAuthRequiredToast";

type ScrapTab = "pattern" | "style";

const scrapTabOptions = [
  { label: "도안 찜", value: "pattern" },
  { label: "스타일 찜", value: "style" },
] as const;

export default function ScrapCollectionScreen() {
  const [query, setQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState<ScrapTab>("pattern");
  const [patternScraps, setPatternScraps] = useState<PatternScrapItem[]>([]);
  const [styleScraps, setStyleScraps] = useState<StyleScrapItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { authStatus, isAuthenticated } = useAuthState();
  const { showAuthRequiredToast, toastMessage } = useAuthRequiredToast();
  const profileHref = isAuthenticated ? "/my" : "/login";
  const normalizedQuery = query.trim().toLowerCase();

  useEffect(() => {
    if (authStatus !== "loading" && !isAuthenticated) {
      showAuthRequiredToast();
    }
  }, [authStatus, isAuthenticated, showAuthRequiredToast]);

  useEffect(() => {
    const controller = new AbortController();

    if (!isAuthenticated) {
      setPatternScraps([]);
      setStyleScraps([]);
      return () => {
        controller.abort();
      };
    }

    setIsLoading(true);

    const loadScraps = async () => {
      try {
        const [nextPatternScraps, nextStyleScraps] = await Promise.all([
          fetchPatternScraps({ signal: controller.signal }),
          fetchStyleScraps({ signal: controller.signal }),
        ]);

        setPatternScraps(nextPatternScraps);
        setStyleScraps(nextStyleScraps);
      } finally {
        setIsLoading(false);
      }
    };

    void loadScraps();

    return () => {
      controller.abort();
    };
  }, [isAuthenticated]);

  const filteredPatternScraps = useMemo(
    () =>
      patternScraps.filter(
        (item) =>
          item.title.toLowerCase().includes(normalizedQuery) ||
          item.author.toLowerCase().includes(normalizedQuery),
      ),
    [normalizedQuery, patternScraps],
  );

  const filteredStyleScraps = useMemo(
    () =>
      styleScraps.filter(
        (item) =>
          item.title.toLowerCase().includes(normalizedQuery) ||
          item.author.toLowerCase().includes(normalizedQuery),
      ),
    [normalizedQuery, styleScraps],
  );

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
          {!isAuthenticated ? (
            <div className="rounded-2xl border border-ufo-border bg-white px-4 py-10 text-center text-sm text-ufo-text-secondary">
              로그인 후 찜한 항목을 확인할 수 있습니다.
            </div>
          ) : isLoading ? (
            <div className="rounded-2xl border border-ufo-border bg-white px-4 py-10 text-center text-sm text-ufo-text-secondary">
              찜 목록을 불러오는 중입니다.
            </div>
          ) : selectedTab === "pattern" ? (
            filteredPatternScraps.length > 0 ? (
              <div className="grid grid-cols-3 gap-x-3 gap-y-6">
                {filteredPatternScraps.map((item) => (
                  <article key={`pattern-${item.id}`}>
                    <PatternCard
                      imageSrc={item.image}
                      imageRatio="4:5"
                      title={item.title}
                      author={item.author}
                      patternId={item.id}
                      isScrapped={item.isScrapped}
                      heartVariant="filled"
                      titleClassName="truncate text-[11px] font-semibold leading-tight"
                      authorClassName="text-[9px] text-ufo-text-neutral"
                      onScrapChange={(nextIsScrapped) => {
                        if (!nextIsScrapped) {
                          setPatternScraps((previous) =>
                            previous.filter((pattern) => pattern.id !== item.id),
                          );
                        }
                      }}
                    />
                  </article>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-ufo-border bg-white px-4 py-10 text-center text-sm text-ufo-text-secondary">
                찜한 도안이 아직 없습니다.
              </div>
            )
          ) : filteredStyleScraps.length > 0 ? (
            <div className="grid grid-cols-3 gap-x-3 gap-y-6">
              {filteredStyleScraps.map((item) => (
                <article key={`style-${item.id}`}>
                  <div className="relative mb-2 aspect-[4/5] w-full overflow-hidden rounded-2xl bg-ufo-bg">
                    <Image
                      src={item.image}
                      alt={`${item.author} style scrap`}
                      fill
                      sizes="(max-width: 430px) 33vw, 140px"
                      className="object-cover"
                    />
                  </div>
                  <p className="truncate text-[11px] font-semibold leading-tight">{item.title}</p>
                  <p className="text-[9px] text-ufo-text-neutral">{item.author}</p>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-ufo-border bg-white px-4 py-10 text-center text-sm text-ufo-text-secondary">
              찜한 스타일이 아직 없습니다.
            </div>
          )}
        </section>
        <Footer />
      </main>
      <ToastMessage message={toastMessage} />
    </div>
  );
}
