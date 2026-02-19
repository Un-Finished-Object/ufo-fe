"use client";

import Link from "next/link";

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

function BackIcon() {
  return (
    <svg 
      width="34" 
      height="34" 
      viewBox="0 0 34 34" 
      fill="none" 
      className="h-6 w-6 fill-none stroke-[#ffaba6]" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M11.0854 18.4166L19.0187 26.35L17 28.3333L5.66663 17L17 5.66663L19.0187 7.64996L11.0854 15.5833H28.3333V18.4166H11.0854Z" fill="#FFABA6"/>
    </svg>
  );
}


function HomeIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-house h-6 w-6 fill-none stroke-current" viewBox="0 0 16 16">
      <path d="M8.707 1.5a1 1 0 0 0-1.414 0L.646 8.146a.5.5 0 0 0 .708.708L2 8.207V13.5A1.5 1.5 0 0 0 3.5 15h9a1.5 1.5 0 0 0 1.5-1.5V8.207l.646.647a.5.5 0 0 0 .708-.708L13 5.793V2.5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1.293zM13 7.207V13.5a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5V7.207l5-5z"/>
    </svg>

  );
}
      

function ChatIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      fill="currentColor"
      className="bi bi-chat-right-fill"
      viewBox="0 0 16 16"
    >
      <path d="M14 0a2 2 0 0 1 2 2v12.793a.5.5 0 0 1-.854.353l-2.853-2.853a1 1 0 0 0-.707-.293H2a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2z" />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      fill="currentColor"
      className="bi bi-person-circle"
      viewBox="0 0 16 16"
    >
      <path d="M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0" />
      <path
        fillRule="evenodd"
        d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8m8-7a7 7 0 0 0-5.468 11.37C3.242 11.226 4.805 10 8 10s4.757 1.225 5.468 2.37A7 7 0 0 0 8 1"
      />
    </svg>
  );
}

function renderRightIcon(type: TopBarRightType) {
  if (type === "home") {
    return <HomeIcon />;
  }

  if (type === "chat") {
    return <ChatIcon />;
  }

  return <ProfileIcon />;
}

function renderLeftIcon(type: TopBarLeftType) {
  if (type === "logo") {
    return (
      <span className="text-3xl font-black lowercase tracking-tight text-[#ffaba6]">
        ufo
      </span>
    );
  }

  return <BackIcon />;
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
  const rightActions = right.slice(0, 2);

  const leftAriaLabel = left === "logo" ? "홈" : "뒤로가기";
  const leftElement = renderLeftIcon(left);

  return (
    <header className={`${sticky ? "sticky top-0" : ""} z-50 w-full`}>
      <div
        className={`mx-auto w-full max-w-[430px] bg-[#ffffff] ${
          showBottomBorder ? "border-b border-[#dddddd]" : ""
        }`}
      >
        <div className="grid h-14 grid-cols-[96px_1fr_96px] items-center px-4">
          <div className="flex items-center">
            {leftHref ? (
              <Link href={leftHref} className="rounded-full p-1" aria-label={leftAriaLabel}>
                {leftElement}
              </Link>
            ) : (
              <button
                type="button"
                onClick={onLeftClick}
                className="rounded-full p-1 text-[ffaba6]"
                aria-label={leftAriaLabel}
              >
                {leftElement}
              </button>
            )}
          </div>

          <div className="truncate px-3 text-center text-base font-semibold text-[#ffaba6]">
            {title ?? ""}
          </div>

          <div className="flex items-center justify-end gap-1 text-[#f39da5]">
            {rightActions.map((action) => {
              const icon = renderRightIcon(action.type);
              const ariaLabel = action.ariaLabel ?? action.type;

              if (action.href) {
                return (
                  <Link
                    key={`${action.type}-${action.href}`}
                    href={action.href}
                    className="rounded-full p-1"
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
                  className="rounded-full p-1"
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
  );
}
