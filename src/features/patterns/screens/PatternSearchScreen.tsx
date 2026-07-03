"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Footer from "@/components/common/Footer";
import Pagination from "@/components/common/Pagination";
import StateBlock from "@/components/common/StateBlock";
import SearchBar from "@/components/common/SearchBar";
import MobileShell from "@/components/layout/MobileShell";
import NavBar from "@/components/navigation/NavBar";
import PatternCard from "@/components/patterns/PatternCard";
import TopBar from "@/components/navigation/TopBar";
import { useAuthState } from "@/features/auth/hooks/useAuthState";
import { patternSearchQueryOptions } from "@/features/patterns/queries/patternSearchQueries";

type PatternSearchScreenProps = {
  initialKeyword: string;
  initialPage: number;
};

export default function PatternSearchScreen({
  initialKeyword,
  initialPage,
}: PatternSearchScreenProps) {
  const router = useRouter();
  const { authStatus, isAuthenticated, data: currentUser } = useAuthState();
  const [query, setQuery] = useState(initialKeyword);
  const trimmedKeyword = initialKeyword.trim();
  const profileHref = isAuthenticated ? "/my" : "/login";
  const authCacheKey = isAuthenticated
    ? currentUser?.userId ?? currentUser?.email ?? "member"
    : "guest";
  const searchResultsQuery = useQuery({
    ...patternSearchQueryOptions(trimmedKeyword, initialPage, authCacheKey),
    enabled: authStatus !== "loading" && trimmedKeyword.length > 0,
  });
  const patternItems = searchResultsQuery.data?.items ?? [];
  const currentPage = searchResultsQuery.data?.page ?? initialPage;
  const nextPage = searchResultsQuery.data?.nextPage ?? 0;

  const handleSearchSubmit = () => {
    const nextKeyword = query.trim();

    if (!nextKeyword) {
      return;
    }

    router.push(`/patterns/search?keyword=${encodeURIComponent(nextKeyword)}&page=1`);
  };

  const handlePageChange = (page: number) => {
    router.push(`/patterns/search?keyword=${encodeURIComponent(trimmedKeyword)}&page=${page}`);
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

        <section className="px-4 pt-5">
          <div className="grid grid-cols-2 gap-x-4 gap-y-6">
            {!trimmedKeyword ? (
              <div className="col-span-2">
                <StateBlock type="empty" title="검색어를 입력해 주세요." variant="plain" />
              </div>
            ) : searchResultsQuery.isPending ? (
              <div className="col-span-2">
                <StateBlock type="loading" title="검색 결과를 불러오는 중..." variant="plain" />
              </div>
            ) : searchResultsQuery.isError ? (
              <div className="col-span-2">
                <StateBlock type="error" title="검색 결과를 불러오지 못했습니다." variant="plain" />
              </div>
            ) : patternItems.length === 0 ? (
              <div className="col-span-2">
                <StateBlock type="empty" title="검색 결과가 없습니다." variant="plain" />
              </div>
            ) : (
              patternItems.map((item) => (
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
              ))
            )}
          </div>
        </section>

        <Pagination
          currentPage={currentPage}
          nextPage={nextPage}
          onPageChange={handlePageChange}
        />
        <Footer />
    </MobileShell>
  );
}
