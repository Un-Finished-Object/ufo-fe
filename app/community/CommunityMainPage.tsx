'use client';

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Footer from "@/components/Footer";
import TopBar from "@/components/TopBar";
import SearchBar from "@/components/SearchBar";
import NavBar from "@/components/NavBar";

export default function CommunityMainPage() {
  const [query, setQuery] = useState("");
  const { isAuthenticated } = useAuth();
  const profileHref = isAuthenticated ? "/mypage" : "/login";

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
        <section className="px-4 py-12 text-center text-base font-semibold text-[#6f6f6f]">
          빈 페이지
        </section>
        <Footer />
      </main>
    </div>
  );
}
