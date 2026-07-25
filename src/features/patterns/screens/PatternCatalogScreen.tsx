"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import FilterChipGroup from "@/components/common/FilterChipGroup";
import Footer from "@/components/common/Footer";
import NavBar from "@/components/navigation/NavBar";
import Pagination from "@/components/common/Pagination";
import StateBlock from "@/components/common/StateBlock";
import MobileShell from "@/components/layout/MobileShell";
import PatternCard from "@/components/patterns/PatternCard";
import SearchBar from "@/components/common/SearchBar";
import TopBar from "@/components/navigation/TopBar";
import { useAuthState } from "@/features/auth/hooks/useAuthState";
import {
  patternCategoryApiMap,
  patternSubCategoryApiMap,
} from "@/features/patterns/lib/patternCategories";
import { patternCatalogQueryOptions } from "@/features/patterns/queries/patternCatalogQueries";

const mainCategories = ["ALL", "의류", "가방/파우치", "목도리/장갑/모자", "기타"] as const;
const clothingSubCategories = [
  "가디건/자켓/볼레로",
  "긴소매 스웨터",
  "반소매 스웨터",
  "조끼/민소매/뷔스티에",
  "원피스",
  "기타",
] as const;
const sortOptions = ["최신순", "인기순", "찜 순"] as const;

const sortApiMap: Record<string, string> = {
  "최신순": "news",
  "인기순": "views",
  "찜 순": "scraps",
};

type PatternCatalogScreenProps = {
  initialPage: number;
};

export default function PatternCatalogScreen({ initialPage }: PatternCatalogScreenProps) {
  const router = useRouter();
  const { authStatus, isAuthenticated, data: currentUser } = useAuthState();
  const [query, setQuery] = useState("");
  const [selectedMainCategory, setSelectedMainCategory] =
    useState<(typeof mainCategories)[number]>("ALL");
  const [selectedClothingSubCategory, setSelectedClothingSubCategory] = useState<
    (typeof clothingSubCategories)[number] | null
  >(null);
  const [selectedSort, setSelectedSort] =
    useState<(typeof sortOptions)[number]>("인기순");
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortMenuRef = useRef<HTMLDivElement | null>(null);
  const [currentPage, setCurrentPage] = useState(initialPage);

  const profileHref = isAuthenticated ? "/my" : "/login";
  const authCacheKey = isAuthenticated
    ? currentUser?.userId ?? currentUser?.email ?? "member"
    : "guest";
  const selectedCategory = patternCategoryApiMap[selectedMainCategory] ?? "all";
  const selectedSortValue = sortApiMap[selectedSort] ?? "views";
  const selectedSubCategory =
    selectedMainCategory === "의류" && selectedClothingSubCategory
      ? patternSubCategoryApiMap[selectedClothingSubCategory] ?? "others"
      : undefined;
  const patternCatalogQuery = useQuery({
    ...patternCatalogQueryOptions({
      category: selectedCategory,
      sort: selectedSortValue,
      page: currentPage,
      viewerKey: authCacheKey,
      subCategory: selectedSubCategory,
    }),
    enabled: authStatus !== "loading",
  });
  const patternItems = patternCatalogQuery.data?.items ?? [];
  const nextPage = patternCatalogQuery.data?.nextPage ?? 0;

  const handleSearchSubmit = () => {
    const keyword = query.trim();

    if (!keyword) {
      return;
    }

    router.push(`/patterns/search?keyword=${encodeURIComponent(keyword)}&page=1`);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    router.push(page === 1 ? "/patterns" : `/patterns?page=${page}`);
  };

  const resetPage = () => {
    setCurrentPage(1);
    router.replace("/patterns");
  };

  const handleMainCategoryClick = (category: (typeof mainCategories)[number]) => {
    setSelectedMainCategory(category);
    setSelectedClothingSubCategory(null);
    resetPage();
  };

  const handleClothingSubCategoryClick = (
    subCategory: (typeof clothingSubCategories)[number],
  ) => {
    setSelectedClothingSubCategory(
      selectedClothingSubCategory === subCategory ? null : subCategory,
    );
    resetPage();
  };

  const handleSortSelect = (sort: (typeof sortOptions)[number]) => {
    setSelectedSort(sort);
    setIsSortOpen(false);
    resetPage();
  };

  useEffect(() => {
    setCurrentPage(initialPage);
  }, [initialPage]);

  useEffect(() => {
    if (!isSortOpen) return;

    const handleOutsideClick = (event: MouseEvent) => {
      if (!sortMenuRef.current?.contains(event.target as Node)) {
        setIsSortOpen(false);
      }
    };

    window.addEventListener("mousedown", handleOutsideClick);
    return () => window.removeEventListener("mousedown", handleOutsideClick);
  }, [isSortOpen]);

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

        <section className="mb-3 mt-2 px-4">
          <FilterChipGroup
            options={mainCategories.map((category) => ({
              label: category,
              value: category,
            }))}
            value={selectedMainCategory}
            onChange={handleMainCategoryClick}
            wrap={false}
          />
        </section>

        {selectedMainCategory === "의류" ? (
          <section className="mb-3 px-4 pt-1">
            <FilterChipGroup
              options={clothingSubCategories.map((subCategory) => ({
                label: subCategory,
                value: subCategory,
              }))}
              value={selectedClothingSubCategory ?? ""}
              onChange={handleClothingSubCategoryClick}
              variant="secondary"
            />
          </section>
        ) : null}

        <section className="mb-4 flex justify-end px-4">
          <div className="relative" ref={sortMenuRef}>
            <button
              type="button"
              onClick={() => setIsSortOpen((prev) => !prev)}
              className="text-xs font-semibold text-ufo-text-dim"
            >
              {selectedSort} ▼
            </button>

            {isSortOpen ? (
              <div className="absolute right-0 top-6 z-10 min-w-[88px] rounded-md border border-ufo-border bg-white py-1">
                {sortOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => handleSortSelect(option)}
                    className={`block w-full px-3 py-1 text-left text-xs ${
                      selectedSort === option
                        ? "font-semibold text-ufo-brand"
                        : "text-ufo-text-secondary"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </section>

        <section className="px-4">
          <div className="grid grid-cols-2 gap-x-4 gap-y-6">
            {patternCatalogQuery.isPending ? (
              <div className="col-span-2">
                <StateBlock type="loading" title="불러오는 중..." variant="plain" />
              </div>
            ) : patternCatalogQuery.isError ? (
              <div className="col-span-2">
                <StateBlock type="error" title="도안을 불러오지 못했습니다." variant="plain" />
              </div>
            ) : patternItems.length === 0 ? (
              <div className="col-span-2">
                <StateBlock type="empty" title="도안이 없습니다." variant="plain" />
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
