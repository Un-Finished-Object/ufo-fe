"use client";

import { useRouter } from "next/navigation";
import BackIcon from "@/components/icons/BackIcon";

type ChatTopBarActionType = "favorite" | "search" | "fo";

type ChatTopBarAction = {
  type: ChatTopBarActionType;
  ariaLabel?: string;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
};

type ChatTopBarProps = {
  title: string;
  subtitle?: string | null;
  onLeftClick?: () => void;
  right?: ChatTopBarAction[];
};

function FavoriteIcon({ active = false }: { active?: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill={active ? "currentColor" : "none"}
      className="h-6 w-6 stroke-current"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="m12 17.27 4.15 2.51-1.1-4.72 3.67-3.18-4.83-.41L12 7l-1.89 4.47-4.83.41 3.67 3.18-1.1 4.72z" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      className="h-5 w-5 stroke-current"
      strokeWidth="2"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="6" />
      <path d="M16 16l5 5" />
    </svg>
  );
}

function FoIcon({ active = false }: { active?: boolean }) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full border px-1.5 py-0.5 text-[17px] leading-none font-black tracking-[-0.04em] ${
        active
          ? "border-ufo-brand bg-ufo-brand text-white"
          : "border-ufo-brand bg-transparent text-ufo-brand"
      }`}
      aria-hidden="true"
    >
      FO
    </span>
  );
}

function renderRightIcon(type: ChatTopBarActionType, active = false) {
  if (type === "favorite") {
    return <FavoriteIcon active={active} />;
  }

  if (type === "search") {
    return <SearchIcon />;
  }

  return <FoIcon active={active} />;
}

export default function ChatTopBar({
  title,
  subtitle = null,
  onLeftClick,
  right = [],
}: ChatTopBarProps) {
  const router = useRouter();
  const leftAriaLabel = "뒤로가기";
  const rightActions = right.slice(0, 3);
  const handleBackClick = onLeftClick ?? (() => router.back());

  return (
    <header className="sticky top-0 z-50 w-full bg-ufo-surface pt-[env(safe-area-inset-top)]">
      <div className="mx-auto w-full max-w-[430px] border-b border-ufo-border-light bg-ufo-surface">
        <div className="flex h-14 items-center gap-2 px-4">
          <div className="flex items-center">
            <button
              type="button"
              onClick={handleBackClick}
              className="flex h-11 w-11 items-center justify-start rounded-full text-ufo-brand"
              aria-label={leftAriaLabel}
            >
              <BackIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="flex min-w-0 flex-1 items-center gap-2 whitespace-nowrap">
            <h1 className="truncate text-base font-semibold text-ufo-text">{title}</h1>
            {subtitle ? (
              <p className="shrink-0 text-sm text-ufo-text-secondary">{subtitle}</p>
            ) : null}
          </div>

          <div className="flex shrink-0 items-center justify-end gap-2 text-ufo-brand whitespace-nowrap">
            {rightActions.map((action) => (
              <button
                key={`${action.type}-${action.ariaLabel ?? action.type}`}
                type="button"
                onClick={action.onClick}
                className="flex h-11 w-11 items-center justify-center rounded-full disabled:cursor-not-allowed disabled:opacity-60"
                aria-label={action.ariaLabel ?? action.type}
                aria-pressed={typeof action.active === "boolean" ? action.active : undefined}
                disabled={action.disabled}
              >
                {renderRightIcon(action.type, action.active)}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
