"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ChatIcon from "@/components/icons/ChatIcon";
import CommentIcon from "@/components/icons/CommentIcon";
import {
  adminNavigationItems,
  isAdminNavigationItemActive,
} from "@/features/admin/lib/adminNavigation";

type AdminNavigationProps = {
  onNavigate?: () => void;
};

export default function AdminNavigation({ onNavigate }: AdminNavigationProps) {
  const pathname = usePathname();

  return (
    <nav aria-label="관리자 메뉴">
      <ul className="space-y-1">
        {adminNavigationItems.map((item) => {
          const isActive = isAdminNavigationItemActive(pathname, item.href);

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={onNavigate}
                aria-current={isActive ? "page" : undefined}
                className={`flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors ${
                  isActive
                    ? "bg-ufo-brand-pale text-ufo-brand"
                    : "text-ufo-text-secondary hover:bg-ufo-bg hover:text-ufo-text"
                }`}
              >
                {item.icon === "chat" ? (
                  <ChatIcon className="h-5 w-5" />
                ) : (
                  <CommentIcon className="h-5 w-5" />
                )}
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
