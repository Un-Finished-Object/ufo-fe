"use client";

import { useEffect, useRef, useState } from "react";
import Footer from "@/components/Footer";
import NavBar from "@/components/NavBar";
import Pagination from "@/components/Pagination";
import PatternCard from "@/components/PatternCard";
import SearchBar from "@/components/SearchBar";
import TopBar from "@/components/TopBar";
import { useAuthState } from "@/hooks/useAuthState";

type PatternItem = {
  id: number;
  title: string;
  author: string;
  image: string;
};

type PatternApiItem = {
  id: number;
  title: string;
  thumbnailUrl: string | null;
  author: string;
};

type PatternsApiResponse = {
  data?: {
    items?: PatternApiItem[];
    totalPages?: number;
  };
  error?: unknown;
};

const mainCategories = ["ALL", "의류", "가방/파우치", "목도리/장갑/모자", "기타"] as const;
const clothingSubCategories = [
  "가디건/자켓/볼레로",
  "스웨터",
  "조끼/민소매/뷔스티에",
  "원피스",
  "기타",
] as const;
const sortOptions = ["최신순", "인기순", "찜 순"] as const;

const categoryApiMap: Record<string, string> = {
  ALL: "all",
  "의류": "apparel",
  "가방/파우치": "bags",
  "목도리/장갑/모자": "accessories",
  "기타": "others",
};

const subCategoryApiMap: Record<string, string> = {
  "가디건/자켓/볼레로": "outer",
  "스웨터": "sweater",
  "조끼/민소매/뷔스티에": "vest",
  "원피스": "dress",
  "기타": "others",
};

const sortApiMap: Record<string, string> = {
  "최신순": "news",
  "인기순": "views",
  "찜 순": "scraps",
};

export default function PatternsMainPage() {
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

  const [patternItems, setPatternItems] = useState<PatternItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const isSingleButtonMode =
    selectedMainCategory === "의류" && selectedClothingSubCategory !== null;
  const profileHref = isAuthenticated ? "/my" : "/login";
  const apiBase = process.env.NEXT_PUBLIC_API_BASE ?? "/api";

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

  useEffect(() => {
    const controller = new AbortController();
    let isMounted = true;
    setIsLoading(true);

    const fetchPatterns = async () => {
      try {
        const params = new URLSearchParams({
          category: categoryApiMap[selectedMainCategory] ?? "all",
          sort: sortApiMap[selectedSort] ?? "views",
          page: String(currentPage),
        });

        if (selectedMainCategory === "의류" && selectedClothingSubCategory) {
          params.set(
            "subCategory",
            subCategoryApiMap[selectedClothingSubCategory] ?? "others",
          );
        }

        const response = await fetch(`${apiBase}/v1/patterns?${params.toString()}`, {
          signal: controller.signal,
        });

        if (!response.ok || !isMounted) return;

        const payload = (await response.json()) as PatternsApiResponse;
        if (payload.error || !payload.data || !isMounted) return;

        const items = (payload.data.items ?? [])
          .filter(
            (item): item is PatternApiItem =>
              typeof item.id === "number" &&
              typeof item.title === "string" &&
              typeof item.author === "string",
          )
          .map((item) => ({
            id: item.id,
            title: item.title,
            author: item.author,
            image: item.thumbnailUrl ?? "/mock/pattern-card.svg",
          }));

        setPatternItems(items);
        setTotalPages(payload.data.totalPages ?? 1);
      } catch {
        // ignore abort / network errors
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    void fetchPatterns();
    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [apiBase, selectedMainCategory, selectedClothingSubCategory, selectedSort, currentPage]);

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

        <section className="mb-3 mt-2 px-4">
          <div className="flex items-center gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {mainCategories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => handleMainCategoryClick(category)}
                className={`h-7 whitespace-nowrap rounded-md px-3 text-xs font-semibold ${
                  selectedMainCategory === category
                    ? "bg-ufo-brand-soft text-[#212121]"
                    : "border border-[#d3d3d3] bg-transparent text-[#777]"
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
                  className="whitespace-nowrap rounded-md bg-ufo-brand-soft px-3 py-1.5 text-xs leading-none font-semibold text-[#212121]"
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
                        ? "bg-ufo-brand-soft text-[#212121]"
                        : "border border-[#d3d3d3] bg-transparent text-[#777]"
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
                        ? "font-semibold text-[#f09fa7]"
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
            {isLoading ? (
              <p className="col-span-2 py-12 text-center text-sm text-ufo-text-muted">
                불러오는 중...
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
                    heartVariant="outline"
                    heartClassName="h-5 w-5 stroke-white"
                  />
                </article>
              ))
            )}
          </div>
        </section>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
        <Footer />
      </main>
    </div>
  );
}
