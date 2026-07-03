'use client';

import { useState } from "react";
import Footer from "@/components/common/Footer";
import StateBlock from "@/components/common/StateBlock";
import MobileShell from "@/components/layout/MobileShell";
import TopBar from "@/components/navigation/TopBar";
import SearchBar from "@/components/common/SearchBar";
import NavBar from "@/components/navigation/NavBar";
import { useAuthState } from "@/features/auth/hooks/useAuthState";

export default function CommunityLandingScreen() {
  const [query, setQuery] = useState("");
  const { isAuthenticated } = useAuthState();
  const profileHref = isAuthenticated ? "/my" : "/login";

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
        <SearchBar value={query} onChange={setQuery} />
        <NavBar />
        <section className="px-4 py-12">
          <StateBlock type="empty" title="빈 페이지" className="px-0 py-0" />
        </section>
        <Footer />
    </MobileShell>
  );
}
