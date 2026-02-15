"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

function ChatIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" fill="currentColor" className="bi bi-chat-right-fill" viewBox="0 0 16 16">
      <path d="M14 0a2 2 0 0 1 2 2v12.793a.5.5 0 0 1-.854.353l-2.853-2.853a1 1 0 0 0-.707-.293H2a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2z"/>
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" fill="currentColor" className="bi bi-person-circle" viewBox="0 0 16 16">
      <path d="M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0"/>
      <path fillRule="evenodd" d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8m8-7a7 7 0 0 0-5.468 11.37C3.242 11.226 4.805 10 8 10s4.757 1.225 5.468 2.37A7 7 0 0 0 8 1"/>
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5 fill-none stroke-[#f3a2aa]"
      strokeWidth="2"
    >
      <circle cx="11" cy="11" r="6" />
      <path d="M16 16l5 5" />
    </svg>
  );
}

const tabs = [
  { label: "홈", href: "/" },
  { label: "도안", href: "/patterns" },
  { label: "스타일", href: "/styles" },
  { label: "찜", href: "/favorites" },
  { label: "커뮤니티", href: "/community" },
];

type NavBarProps = {
  showSearchAndTabs?: boolean;
};

export default function NavBar({ showSearchAndTabs = true }: NavBarProps) {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();
  const profileHref = isAuthenticated ? "/mypage" : "/login";

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-50 w-full">
      <div className="mx-auto w-full max-w-[430px] bg-[#ffffff]">
        <div className="px-5 pt-4">
          <div className="mb-4 flex items-center justify-between">
            <Link
              href="/"
              className="text-3xl font-black lowercase tracking-tight text-[#ffaba6]"
              aria-label="Home"
            >
              ufo
            </Link>
            <div className="flex items-center gap-3">
              <Link
                href="/chats"
                className="rounded-full p-1 text-[#ffaba6]"
                aria-label="Chat rooms"
              >
                <ChatIcon />
              </Link>
              <Link
                href={profileHref}
                className="rounded-full p-1 text-[#ffaba6]"
                aria-label="My Page"
              >
                <ProfileIcon />
              </Link>
            </div>
          </div>

          {showSearchAndTabs ? (
            <section className="mb-4" aria-label="Search">
              <div className="flex h-10 items-center gap-2 rounded-full bg-[#fff1ed] px-4 text-sm text-[#cba8ac]">
                <SearchIcon />
                <span>검색어를 입력해 주세요</span>
              </div>
            </section>
          ) : null}
        </div>

        {showSearchAndTabs ? (
          <section className="border-b border-[#dddddd]" aria-label="Main tabs">
            <div className="px-7">
              <div className="flex items-center text-sm text-[#9e9e9e]">
                {tabs.map((tab) => (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    className={`relative flex-1 pb-3 text-center ${isActive(tab.href) ? "font-semibold text-[#ffb5b3]" : ""}`}
                  >
                    {tab.label}
                    {isActive(tab.href) ? (
                      <span className="absolute left-1/2 -bottom-px h-[2px] w-16 -translate-x-1/2 bg-[#ffb5b3]" />
                    ) : null}
                  </Link>
                ))}
              </div>
            </div>
          </section>
        ) : null}
      </div>
    </header>
  );
}
