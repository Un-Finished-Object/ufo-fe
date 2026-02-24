"use client";

type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onSubmit?: () => void;
  disabled?: boolean;
  autoFocus?: boolean;
  showBottomBorder?: boolean;
};

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

export default function SearchBar({
  value,
  onChange,
  placeholder = "검색어를 입력해 주세요",
  onSubmit,
  disabled = false,
  autoFocus = false,
  showBottomBorder = false,
}: SearchBarProps) {
  return (
    <div className={`mt-4 mb-4 ${showBottomBorder ? "border-b border-[#dddddd] pb-4" : ""}`}>
      <form
        className="px-5"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit?.();
        }}
        role="search"
        aria-label="검색"
      >
        <label className="flex h-10 items-center gap-2 rounded-full bg-[#fff1ed] px-4 text-sm text-[#cba8ac]">
          <SearchIcon />
          <span className="sr-only">검색어</span>
          <input
            type="text"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            autoFocus={autoFocus}
            className="w-full bg-transparent text-sm text-[#4d4d4d] placeholder:text-[#cba8ac] focus:outline-none"
          />
        </label>
      </form>
    </div>
  );
}
