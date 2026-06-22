"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import Footer from "@/components/common/Footer";
import Pagination from "@/components/common/Pagination";
import ToastMessage from "@/components/common/ToastMessage";
import TopBar from "@/components/navigation/TopBar";
import SearchBar from "@/components/common/SearchBar";
import NavBar from "@/components/navigation/NavBar";
import PatternCard from "@/components/patterns/PatternCard";
import { useAuthState } from "@/features/auth/hooks/useAuthState";
import {
  patternScrapQueryKeys,
  patternScrapsQueryOptions,
} from "@/features/scraps/queries/patternScrapQueries";
import type { PatternScrapResult } from "@/features/scraps/services/fetchPatternScraps";
import { useAuthRequiredToast } from "@/hooks/useAuthRequiredToast";

export default function ScrapCollectionScreen() {
  const [query, setQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const { authStatus, isAuthenticated } = useAuthState();
  const { showAuthRequiredToast, toastMessage } = useAuthRequiredToast();
  const queryClient = useQueryClient();
  const profileHref = isAuthenticated ? "/my" : "/login";
  const normalizedQuery = query.trim().toLowerCase();
  const patternScrapsQuery = useQuery(
    patternScrapsQueryOptions(currentPage, { enabled: isAuthenticated }),
  );
  const patternScrapItems = patternScrapsQuery.data?.items;
  const nextPage = patternScrapsQuery.data?.nextPage ?? 0;

  useEffect(() => {
    if (authStatus !== "loading" && !isAuthenticated) {
      showAuthRequiredToast();
    }
  }, [authStatus, isAuthenticated, showAuthRequiredToast]);

  const filteredPatternScraps = useMemo(
    () =>
      (patternScrapItems ?? []).filter(
        (item) =>
          item.title.toLowerCase().includes(normalizedQuery) ||
          item.author.toLowerCase().includes(normalizedQuery),
      ),
    [normalizedQuery, patternScrapItems],
  );

  const handleQueryChange = (nextQuery: string) => {
    setQuery(nextQuery);
    setCurrentPage(1);
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
        <SearchBar value={query} onChange={handleQueryChange} />
        <NavBar />

        <section className="px-4 pt-5">
          {!isAuthenticated ? (
            <div className="rounded-2xl border border-ufo-border bg-white px-4 py-10 text-center text-sm text-ufo-text-secondary">
              로그인 후 찜한 항목을 확인할 수 있습니다.
            </div>
          ) : patternScrapsQuery.isPending ? (
            <p className="py-12 text-center text-sm text-ufo-text-muted">
              불러오는 중...
            </p>
          ) : patternScrapsQuery.isError ? (
            <p className="py-12 text-center text-sm text-ufo-text-muted">
              찜 목록을 불러오지 못했습니다.
            </p>
          ) : (
            filteredPatternScraps.length > 0 ? (
              <div className="grid grid-cols-2 gap-x-4 gap-y-6">
                {filteredPatternScraps.map((item) => (
                  <article key={`pattern-${item.id}`}>
                    <PatternCard
                      imageSrc={item.image}
                      imageRatio="1:1"
                      title={item.title}
                      author={item.author}
                      patternId={item.id}
                      isScrapped={item.isScrapped}
                      heartVariant="filled"
                      onScrapChange={(nextIsScrapped) => {
                        if (!nextIsScrapped) {
                          queryClient.setQueryData(
                            patternScrapQueryKeys.page(currentPage),
                            (previous: PatternScrapResult | undefined) =>
                              previous
                                ? {
                                    ...previous,
                                    items: previous.items.filter((pattern) => pattern.id !== item.id),
                                  }
                                : previous,
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
          )}
        </section>
        {isAuthenticated && !patternScrapsQuery.isPending && !patternScrapsQuery.isError ? (
          <Pagination
            currentPage={currentPage}
            nextPage={nextPage}
            onPageChange={setCurrentPage}
          />
        ) : null}
        <Footer />
      </main>
      <ToastMessage message={toastMessage} />
    </div>
  );
}
