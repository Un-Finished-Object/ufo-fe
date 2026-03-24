"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Footer from "@/components/common/Footer";
import Pagination from "@/components/common/Pagination";
import SearchBar from "@/components/common/SearchBar";
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
  const { isAuthenticated } = useAuthState();
  const [query, setQuery] = useState(initialKeyword);
  const trimmedKeyword = initialKeyword.trim();
  const profileHref = isAuthenticated ? "/my" : "/login";
  const searchResultsQuery = useQuery(patternSearchQueryOptions(trimmedKeyword, initialPage));
  const patternItems = searchResultsQuery.data?.items ?? [];
  const currentPage = searchResultsQuery.data?.page ?? initialPage;
  const totalPages = searchResultsQuery.data?.totalPages ?? 1;

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

        <section className="px-4 pt-5">
          <div className="grid grid-cols-2 gap-x-4 gap-y-6">
            {!trimmedKeyword ? (
              <p className="col-span-2 py-12 text-center text-sm text-ufo-text-muted">
                검색어를 입력해 주세요.
              </p>
            ) : searchResultsQuery.isPending ? (
              <p className="col-span-2 py-12 text-center text-sm text-ufo-text-muted">
                검색 결과를 불러오는 중...
              </p>
            ) : searchResultsQuery.isError ? (
              <p className="col-span-2 py-12 text-center text-sm text-ufo-text-muted">
                검색 결과를 불러오지 못했습니다.
              </p>
            ) : patternItems.length === 0 ? (
              <p className="col-span-2 py-12 text-center text-sm text-ufo-text-muted">
                검색 결과가 없습니다.
              </p>
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
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
        <Footer />
      </main>
    </div>
  );
}
