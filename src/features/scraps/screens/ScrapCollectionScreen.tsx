"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Footer from "@/components/common/Footer";
import Pagination from "@/components/common/Pagination";
import StateBlock from "@/components/common/StateBlock";
import ToastMessage from "@/components/common/ToastMessage";
import MobileShell from "@/components/layout/MobileShell";
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

type ScrapCollectionScreenProps = {
  initialPage: number;
};

export default function ScrapCollectionScreen({ initialPage }: ScrapCollectionScreenProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(initialPage);
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

  useEffect(() => {
    setCurrentPage(initialPage);
  }, [initialPage]);

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

    if (currentPage !== 1) {
      router.replace("/scraps");
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    router.push(page === 1 ? "/scraps" : `/scraps?page=${page}`);
  };

  return (
    <>
      <MobileShell surfaceClassName="pb-10">
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
            <StateBlock type="empty" title="로그인 후 찜한 항목을 확인할 수 있습니다." className="px-0 py-0" />
          ) : patternScrapsQuery.isPending ? (
            <StateBlock type="loading" title="불러오는 중..." variant="plain" />
          ) : patternScrapsQuery.isError ? (
            <StateBlock type="error" title="찜 목록을 불러오지 못했습니다." variant="plain" />
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
              <StateBlock type="empty" title="찜한 도안이 아직 없습니다." className="px-0 py-0" />
            )
          )}
        </section>
        {isAuthenticated && !patternScrapsQuery.isPending && !patternScrapsQuery.isError ? (
          <Pagination
            currentPage={currentPage}
            nextPage={nextPage}
            onPageChange={handlePageChange}
          />
        ) : null}
        <Footer />
      </MobileShell>
      <ToastMessage message={toastMessage} />
    </>
  );
}
