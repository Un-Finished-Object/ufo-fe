"use client";

type StateBlockType = "loading" | "error" | "empty";
type StateBlockVariant = "card" | "plain";

type StateBlockProps = {
  type: StateBlockType;
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  variant?: StateBlockVariant;
  className?: string;
};

const fallbackTitle: Record<StateBlockType, string> = {
  loading: "불러오는 중...",
  error: "정보를 불러오지 못했어요.",
  empty: "표시할 내용이 없습니다.",
};

function joinClasses(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function LoadingSpinner() {
  return (
    <span
      className="h-8 w-8 animate-spin rounded-full border-4 border-ufo-border-light border-t-ufo-brand-pale"
      aria-hidden="true"
    />
  );
}

export default function StateBlock({
  type,
  title,
  description,
  actionLabel,
  onAction,
  variant = "card",
  className,
}: StateBlockProps) {
  if (variant === "plain") {
    return (
      <p className={joinClasses("px-4 py-8 text-center text-sm text-ufo-text-dim", className)}>
        {title ?? description ?? fallbackTitle[type]}
      </p>
    );
  }

  return (
    <section className={joinClasses("px-6 py-12", className)}>
      <div className="flex flex-col items-center justify-center rounded-2xl border border-ufo-border bg-white px-6 py-10 text-center">
        {type === "loading" ? <LoadingSpinner /> : null}
        <p
          className={joinClasses(
            type === "loading" ? "mt-4 text-sm font-medium" : "text-base font-semibold",
            type === "loading" ? "text-ufo-text-secondary" : "text-ufo-text",
          )}
        >
          {title ?? fallbackTitle[type]}
        </p>
        {description ? (
          <p className="mt-2 text-sm text-ufo-text-secondary">{description}</p>
        ) : null}
        {actionLabel && onAction ? (
          <button
            type="button"
            onClick={onAction}
            className="mt-5 rounded-xl bg-ufo-brand-soft px-4 py-2 text-sm font-semibold text-white"
          >
            {actionLabel}
          </button>
        ) : null}
      </div>
    </section>
  );
}
