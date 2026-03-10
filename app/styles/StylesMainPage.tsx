'use client';

import Image from "next/image";
import { useState } from "react";
import Footer from "@/components/Footer";
import TopBar from "@/components/TopBar";
import SearchBar from "@/components/SearchBar";
import NavBar from "@/components/NavBar";
import HeartIcon from "@/components/icons/HeartIcon";
import { useAuthState } from "@/hooks/useAuthState";

type StylePost = {
  id: number;
  author: string;
  likeCount: number;
  image: string;
};

const stylePosts: StylePost[] = [
  { id: 1, author: "뜨개하는 환위", likeCount: 12, image: "/mock/pattern-card.svg" },
  { id: 2, author: "뜨개하는 환위", likeCount: 12, image: "/mock/plush-pink.svg" },
  { id: 3, author: "뜨개하는 환위", likeCount: 12, image: "/mock/plush-white.svg" },
  { id: 4, author: "뜨개하는 환위", likeCount: 12, image: "/mock/pattern-card.svg" },
  { id: 5, author: "뜨개하는 환위", likeCount: 12, image: "/mock/plush-pink.svg" },
  { id: 6, author: "뜨개하는 환위", likeCount: 12, image: "/mock/plush-white.svg" },
];

export default function StylesMainPage() {
  const [query, setQuery] = useState("");
  const { isAuthenticated } = useAuthState();
  const profileHref = isAuthenticated ? "/my" : "/login";

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

        <section className="px-4 pb-2 pt-3">
          <div className="mb-3 flex justify-end">
            <p className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#9f9f9f]">
              최신순
              <svg aria-hidden="true" viewBox="0 0 12 12" className="h-3 w-3 fill-[#9f9f9f]">
                <path d="M2.2 4.3a.6.6 0 0 1 .85 0L6 7.25 8.95 4.3a.6.6 0 0 1 .85.85l-3.4 3.4a.6.6 0 0 1-.85 0l-3.4-3.4a.6.6 0 0 1 0-.85Z" />
              </svg>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-x-3 gap-y-4">
            {stylePosts.map((post) => (
              <article key={post.id}>
                <div className="relative mb-2 aspect-[167/200] w-full overflow-hidden rounded-[16px] bg-[#f3f3f3]">
                  <Image
                    src={post.image}
                    alt=""
                    fill
                    sizes="(max-width: 430px) 50vw, 190px"
                    className="object-cover"
                  />
                </div>
                <div className="flex items-center justify-between px-0.5 text-[8px] text-[#c3c3c3]">
                  <p className="flex items-center gap-1">
                    <span aria-hidden="true" className="h-2 w-2 rounded-full bg-[#f8d9dc]" />
                    <span>{post.author}</span>
                  </p>
                  <p className="flex items-center gap-0.5 text-[#f4a7ae]">
                    <HeartIcon className="h-[10px] w-[10px] stroke-[#f4a7ae]" />
                    <span>{post.likeCount}</span>
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>
        <Footer />
      </main>
    </div>
  );
}
