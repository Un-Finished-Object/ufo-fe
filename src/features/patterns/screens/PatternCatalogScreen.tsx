"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Footer from "@/components/common/Footer";
import NavBar from "@/components/navigation/NavBar";
import Pagination from "@/components/common/Pagination";
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
  "스웨터",
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

export default function PatternCatalogScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuthState();
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
  const [currentPage, setCurrentPage] = useState(1);

  const isSingleButtonMode =
    selectedMainCategory === "의류" && selectedClothingSubCategory !== null;
  const profileHref = isAuthenticated ? "/my" : "/login";
  const selectedCategory = patternCategoryApiMap[selectedMainCategory] ?? "all";
  const selectedSortValue = sortApiMap[selectedSort] ?? "views";
  const selectedSubCategory =
    selectedMainCategory === "의류" && selectedClothingSubCategory
      ? patternSubCategoryApiMap[selectedClothingSubCategory] ?? "others"
      : undefined;
  const patternCatalogQuery = useQuery(
    patternCatalogQueryOptions({
      category: selectedCategory,
      sort: selectedSortValue,
      page: currentPage,
      subCategory: selectedSubCategory,
    }),
  );
  const patternItems = patternCatalogQuery.data?.items ?? [];
  const nextPage = patternCatalogQuery.data?.nextPage ?? 0;

  const handleSearchSubmit = () => {
    const keyword = query.trim();

    if (!keyword) {
      return;
    }

    router.push(`/patterns/search?keyword=${encodeURIComponent(keyword)}&page=1`);
  };

  const handleMainCategoryClick = (category: (typeof mainCategories)[number]) => {
    setSelectedMainCategory(category);
    setSelectedClothingSubCategory(null);
    setCurrentPage(1);
  };

  const handleClothingSubCategoryClick = (
    subCategory: (typeof clothingSubCategories)[number],
  ) => {
    setSelectedClothingSubCategory(
      selectedClothingSubCategory === subCategory ? null : subCategory,
    );
    setCurrentPage(1);
  };

  const handleSortSelect = (sort: (typeof sortOptions)[number]) => {
    setSelectedSort(sort);
    setIsSortOpen(false);
    setCurrentPage(1);
  };

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

        <section className="mb-3 mt-2 px-4">
          <div className="flex items-center gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {mainCategories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => handleMainCategoryClick(category)}
                className={`h-7 whitespace-nowrap rounded-md px-3 text-xs font-semibold ${
                  selectedMainCategory === category
                    ? "bg-ufo-brand-soft text-ufo-text"
                    : "border border-ufo-border bg-transparent text-ufo-text-secondary"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </section>

        {selectedMainCategory === "의류" ? (
          <section className="mb-3 px-4">
            <div className="flex flex-wrap items-center gap-2">
              {isSingleButtonMode && selectedClothingSubCategory ? (
                <button
                  type="button"
                  onClick={() => setSelectedClothingSubCategory(null)}
                  className="whitespace-nowrap rounded-md bg-ufo-brand-soft px-3 py-1.5 text-xs leading-none font-semibold text-ufo-text"
                >
                  {selectedClothingSubCategory}
                </button>
              ) : (
                clothingSubCategories.map((subCategory) => (
                  <button
                    key={subCategory}
                    type="button"
                    onClick={() => handleClothingSubCategoryClick(subCategory)}
                    className={`whitespace-nowrap rounded-md px-3 py-1.5 text-xs leading-none font-semibold ${
                      selectedClothingSubCategory === subCategory
                        ? "bg-ufo-brand-soft text-ufo-text"
                        : "border border-ufo-border bg-transparent text-ufo-text-secondary"
                    }`}
                  >
                    {subCategory}
                  </button>
                ))
              )}
            </div>
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
              <p className="col-span-2 py-12 text-center text-sm text-ufo-text-muted">
                불러오는 중...
              </p>
            ) : patternCatalogQuery.isError ? (
              <p className="col-span-2 py-12 text-center text-sm text-ufo-text-muted">
                도안을 불러오지 못했습니다.
              </p>
            ) : patternItems.length === 0 ? (
              <p className="col-span-2 py-12 text-center text-sm text-ufo-text-muted">
                도안이 없습니다.
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
          nextPage={nextPage}
          onPageChange={setCurrentPage}
        />
        <Footer />
      </main>
    </div>
  );
}
