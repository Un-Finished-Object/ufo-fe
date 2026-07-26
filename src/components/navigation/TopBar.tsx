"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { MouseEvent } from "react";
import ToastMessage from "@/components/common/ToastMessage";
import BackIcon from "@/components/icons/BackIcon";
import ChatIcon from "@/components/icons/ChatIcon";
import HomeIcon from "@/components/icons/HomeIcon";
import ProfileIcon from "@/components/icons/ProfileIcon";
import { useAuthState } from "@/features/auth/hooks/useAuthState";
import { useAuthRequiredToast } from "@/hooks/useAuthRequiredToast";

type TopBarLeftType = "logo" | "back";
type TopBarRightType = "home" | "chat" | "profile";

type TopBarAction = {
  type: TopBarRightType;
  href?: string;
  onClick?: () => void;
  ariaLabel?: string;
};

type TopBarProps = {
  left: TopBarLeftType;
  leftHref?: string;
  title?: string | null;
  right?: TopBarAction[];
  onLeftClick?: () => void;
  sticky?: boolean;
  showBottomBorder?: boolean;
};

const protectedRoutePrefixes = ["/my", "/scraps", "/chats", "/events"];

function isProtectedHref(href: string) {
  return protectedRoutePrefixes.some(
    (route) => href === route || href.startsWith(`${route}/`),
  );
}

function renderRightIcon(type: TopBarRightType) {
  if (type === "home") {
    return <HomeIcon className="h-6 w-6" />;
  }

  if (type === "chat") {
    return <ChatIcon className="h-6 w-6" />;
  }

  return <ProfileIcon className="h-6 w-6" />;
}

function renderLeftIcon(type: TopBarLeftType) {
  if (type === "logo") {
    return (
      <Image
        src="/ufo_pk.webp"
        alt=""
        width={162}
        height={120}
        priority
        className="h-10 w-auto shrink-0"
      />
    );
  }

  return <BackIcon className="h-6 w-6 text-ufo-brand" />;
}

export default function TopBar({
  left,
  leftHref,
  title = null,
  right = [],
  onLeftClick,
  sticky = true,
  showBottomBorder = false,
}: TopBarProps) {
  const router = useRouter();
  const { authStatus, isAuthenticated } = useAuthState();
  const { showAuthRequiredToast, toastMessage } = useAuthRequiredToast();
  const rightActions = right.slice(0, 2);
  const leftAriaLabel = left === "logo" ? "UFO 홈" : "뒤로가기";
  const leftElement = renderLeftIcon(left);
  const handleBackClick = onLeftClick ?? (() => router.back());
  const handleProtectedLinkClick = (event: MouseEvent<HTMLAnchorElement>, href: string) => {
    if (!isProtectedHref(href) || authStatus === "loading" || isAuthenticated) {
      return;
    }

    event.preventDefault();
    showAuthRequiredToast();
  };

  return (
    <>
      <header className={`${sticky ? "sticky top-0" : ""} z-50 w-full`}>
        <div
          className={`mx-auto w-full max-w-[430px] bg-ufo-surface ${
            showBottomBorder ? "border-b border-ufo-border-light" : ""
          }`}
        >
        <div className="grid h-14 grid-cols-[96px_1fr_96px] items-center px-4">
          <div className="flex items-center">
            {left === "logo" && leftHref ? (
              <Link
                href={leftHref}
                className="flex h-8 min-w-[69px] items-center justify-start rounded-full"
                aria-label={leftAriaLabel}
              >
                {leftElement}
              </Link>
            ) : (
              <button
                type="button"
                onClick={left === "back" ? handleBackClick : onLeftClick}
                className="flex h-10 w-8 items-center justify-start rounded-full text-ufo-brand"
                aria-label={leftAriaLabel}
              >
                {leftElement}
              </button>
            )}
          </div>

          <div className="truncate px-3 text-center text-base font-semibold text-ufo-brand">
            {title ?? ""}
          </div>

          <div className="flex items-center justify-end gap-1 text-ufo-brand">
            {rightActions.map((action) => {
              const icon = renderRightIcon(action.type);
              const ariaLabel = action.ariaLabel ?? action.type;

              if (action.href) {
                return (
                  <Link
                    key={`${action.type}-${action.href}`}
                    href={action.href}
                    onClick={(event) => handleProtectedLinkClick(event, action.href ?? "")}
                    className="flex h-8 w-8 items-center justify-center rounded-full"
                    aria-label={ariaLabel}
                  >
                    {icon}
                  </Link>
                );
              }

              return (
                <button
                  key={`${action.type}-${ariaLabel}`}
                  type="button"
                  onClick={action.onClick}
                  className="flex h-8 w-8 items-center justify-center rounded-full"
                  aria-label={ariaLabel}
                >
                  {icon}
                </button>
              );
            })}
          </div>
        </div>
        </div>
      </header>
      <ToastMessage message={toastMessage} />
    </>
  );
}
