"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { label: "홈", href: "/" },
  { label: "도안", href: "/patterns" },
  { label: "스타일", href: "/styles" },
  { label: "찜", href: "/scraps" },
  { label: "커뮤니티", href: "/community" },
];

export default function NavBar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  return (
    <header className="w-full">
      <div className="mx-auto w-full max-w-[430px] bg-[#ffffff]">
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
      </div>
    </header>
  );
}
