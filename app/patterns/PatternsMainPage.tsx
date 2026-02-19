"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import Footer from "@/components/Footer";
import NavBar from "@/components/NavBar";
import SearchBar from "@/components/SearchBar";
import TopBar from "@/components/TopBar";
import { useAuth } from "@/contexts/AuthContext";

type PatternItem = {
  id: number;
  title: string;
  author: string;
  image: string;
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

const patternItems: PatternItem[] = [
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
    image: "/mock/plush-pink.svg",
  },
  {
    id: 3,
    title: "라인패치아노락(Line Patch)",
    author: "@da0_knit대금",
    image: "/mock/plush-white.svg",
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
    image: "/mock/plush-pink.svg",
  },
];

function HeartIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5 fill-none stroke-white"
      strokeWidth="2"
    >
      <path d="M12.1 20.7c-.1.1-.3.1-.4 0-5-4.5-8.2-7.4-8.2-11A4.9 4.9 0 0 1 8.4 4.8c1.5 0 2.9.7 3.8 1.8.9-1.1 2.3-1.8 3.8-1.8a4.9 4.9 0 0 1 4.9 4.9c0 3.6-3.2 6.5-8.2 11Z" />
    </svg>
  );
}

export default function PatternsMainPage() {
  const { isAuthenticated } = useAuth();
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

  const isSingleButtonMode =
    selectedMainCategory === "의류" && selectedClothingSubCategory !== null;
  const profileHref = isAuthenticated ? "/mypage" : "/login";

  const handleMainCategoryClick = (category: (typeof mainCategories)[number]) => {
    setSelectedMainCategory(category);
    setSelectedClothingSubCategory(null);
  };

  const handleClothingSubCategoryClick = (
    subCategory: (typeof clothingSubCategories)[number],
  ) => {
    if (selectedClothingSubCategory === subCategory) {
      setSelectedClothingSubCategory(null);
      return;
    }
    setSelectedClothingSubCategory(subCategory);
  };

  useEffect(() => {
    if (!isSortOpen) {
      return;
    }

    const handleOutsideClick = (event: MouseEvent) => {
      if (!sortMenuRef.current) {
        return;
      }

      if (!sortMenuRef.current.contains(event.target as Node)) {
        setIsSortOpen(false);
      }
    };

    window.addEventListener("mousedown", handleOutsideClick);
    return () => {
      window.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isSortOpen]);

  return (
    <div className="min-h-screen bg-[#ececec]">
      <main className="mx-auto min-h-screen w-full max-w-[430px] bg-[#ffffff] pb-10 text-[#1f1f1f]">
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
                    ? "bg-[#ffb5b3] text-[#212121]"
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
                  className="whitespace-nowrap rounded-md bg-[#ffb5b3] px-3 py-1.5 text-xs leading-none font-semibold text-[#212121]"
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
                        ? "bg-[#ffb5b3] text-[#212121]"
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
              onClick={() => setIsSortOpen((previous) => !previous)}
              className="text-xs font-semibold text-[#9a9a9a]"
            >
              {selectedSort} ▼
            </button>

            {isSortOpen ? (
              <div className="absolute right-0 top-6 z-10 min-w-[88px] rounded-md border border-[#d9d9d9] bg-white py-1">
                {sortOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      setSelectedSort(option);
                      setIsSortOpen(false);
                    }}
                    className={`block w-full px-3 py-1 text-left text-xs ${
                      selectedSort === option
                        ? "font-semibold text-[#f09fa7]"
                        : "text-[#6f6f6f]"
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
            {patternItems.map((item) => (
              <article key={item.id}>
                <div className="relative mb-2 aspect-square overflow-hidden rounded-2xl">
                  <Image src={item.image} alt={`${item.title} image`} fill className="object-cover" />
                  <div className="absolute bottom-2 right-2">
                    <HeartIcon />
                  </div>
                </div>
                <p className="truncate text-[13px] font-semibold">{item.title}</p>
                <p className="text-[10px] text-[#8c8c8c]">{item.author}</p>
              </article>
            ))}
          </div>
        </section>

        <Footer />
      </main>
    </div>
  );
}
