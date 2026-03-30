"use client";

type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onSubmit?: () => void;
  showSubmitButton?: boolean;
  submitLabel?: string;
  submitDisabled?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  showBottomBorder?: boolean;
};

function SearchIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5 fill-none stroke-ufo-brand"
      strokeWidth="2"
    >
      <circle cx="11" cy="11" r="6" />
      <path d="M16 16l5 5" />
    </svg>
  );
}

export default function SearchBar({
  value,
  onChange,
  placeholder = "검색어를 입력해 주세요",
  onSubmit,
  showSubmitButton = false,
  submitLabel = "검색",
  submitDisabled = false,
  disabled = false,
  autoFocus = false,
  showBottomBorder = false,
}: SearchBarProps) {
  return (
    <div className={`mt-4 mb-4 ${showBottomBorder ? "border-b border-ufo-border-light pb-4" : ""}`}>
      <form
        className="flex items-center gap-2 px-5"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit?.();
        }}
        role="search"
        aria-label="검색"
      >
        <label className="flex h-10 flex-1 items-center gap-2 rounded-full bg-ufo-brand-pale px-4 text-sm text-ufo-text-muted">
          <SearchIcon />
          <span className="sr-only">검색어</span>
          <input
            type="text"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            autoFocus={autoFocus}
            enterKeyHint="search"
            className="w-full bg-transparent text-sm text-ufo-text placeholder:text-ufo-text-muted focus:outline-none"
          />
        </label>
        {showSubmitButton ? (
          <button
            type="submit"
            disabled={disabled || submitDisabled}
            className="flex h-10 shrink-0 items-center justify-center rounded-full bg-ufo-text px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-ufo-text-dim"
            aria-label={submitLabel}
          >
            {submitLabel}
          </button>
        ) : null}
      </form>
    </div>
  );
}
