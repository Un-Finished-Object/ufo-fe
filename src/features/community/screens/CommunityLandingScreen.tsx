'use client';

import { useState } from "react";
import Footer from "@/components/common/Footer";
import TopBar from "@/components/navigation/TopBar";
import SearchBar from "@/components/common/SearchBar";
import NavBar from "@/components/navigation/NavBar";
import { useAuthState } from "@/features/auth/hooks/useAuthState";

export default function CommunityLandingScreen() {
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
        <section className="px-4 py-12 text-center text-base font-semibold text-ufo-text-secondary">
          빈 페이지
        </section>
        <Footer />
      </main>
    </div>
  );
}
