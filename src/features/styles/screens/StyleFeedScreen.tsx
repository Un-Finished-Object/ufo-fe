"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import Footer from "@/components/common/Footer";
import TopBar from "@/components/navigation/TopBar";
import SearchBar from "@/components/common/SearchBar";
import NavBar from "@/components/navigation/NavBar";
import HeartIcon from "@/components/icons/HeartIcon";
import { useAuthState } from "@/features/auth/hooks/useAuthState";
import { fetchStyleFeed, type StyleFeedItem } from "@/features/styles/services/fetchStyleFeed";

export default function StyleFeedScreen() {
  const [query, setQuery] = useState("");
  const [stylePosts, setStylePosts] = useState<StyleFeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated } = useAuthState();
  const profileHref = isAuthenticated ? "/my" : "/login";
  const normalizedQuery = query.trim().toLowerCase();

  useEffect(() => {
    const controller = new AbortController();

    const loadStyleFeed = async () => {
      try {
        const items = await fetchStyleFeed({ signal: controller.signal });
        setStylePosts(items);
      } finally {
        setIsLoading(false);
      }
    };

    void loadStyleFeed();

    return () => {
      controller.abort();
    };
  }, []);

  const filteredPosts = useMemo(
    () => stylePosts.filter((post) => post.author.toLowerCase().includes(normalizedQuery)),
    [normalizedQuery, stylePosts],
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

        <section className="px-4 pb-2 pt-3">
          <div className="mb-3 flex justify-end">
            <p className="inline-flex items-center gap-1 text-[10px] font-semibold text-ufo-text-dim">
              최신순
              <svg aria-hidden="true" viewBox="0 0 12 12" className="h-3 w-3 fill-current">
                <path d="M2.2 4.3a.6.6 0 0 1 .85 0L6 7.25 8.95 4.3a.6.6 0 0 1 .85.85l-3.4 3.4a.6.6 0 0 1-.85 0l-3.4-3.4a.6.6 0 0 1 0-.85Z" />
              </svg>
            </p>
          </div>

          {isLoading ? (
            <div className="rounded-2xl border border-ufo-border bg-white px-4 py-10 text-center text-sm text-ufo-text-secondary">
              스타일 피드를 불러오는 중입니다.
            </div>
          ) : filteredPosts.length > 0 ? (
            <div className="grid grid-cols-2 gap-x-3 gap-y-4">
              {filteredPosts.map((post) => (
                <article key={post.id}>
                  <div className="relative mb-2 aspect-[167/200] w-full overflow-hidden rounded-[16px] bg-ufo-bg">
                    <Image
                      src={post.image}
                      alt={`${post.author} style post`}
                      fill
                      sizes="(max-width: 430px) 50vw, 190px"
                      className="object-cover"
                    />
                  </div>
                  <div className="flex items-center justify-between px-0.5 text-[8px] text-ufo-text-muted">
                    <p className="flex items-center gap-1">
                      <span aria-hidden="true" className="h-2 w-2 rounded-full bg-ufo-brand-soft" />
                      <span>{post.author}</span>
                    </p>
                    <p className="flex items-center gap-0.5 text-ufo-brand">
                      <HeartIcon className="h-[10px] w-[10px] stroke-ufo-brand" />
                      <span>{post.likeCount}</span>
                    </p>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-ufo-border bg-white px-4 py-10 text-center text-sm text-ufo-text-secondary">
              스타일 피드가 아직 없습니다.
            </div>
          )}
        </section>
        <Footer />
      </main>
    </div>
  );
}
