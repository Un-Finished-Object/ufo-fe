type AdminRefreshButtonProps = {
  onRefresh: () => void;
  isRefreshing: boolean;
  label?: string;
};

function RefreshIcon({ isRefreshing }: { isRefreshing: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={`h-4 w-4 fill-none stroke-current ${isRefreshing ? "animate-spin" : ""}`}
      strokeWidth="2"
    >
      <path d="M20 7v5h-5M4 17v-5h5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6.1 9a7 7 0 0 1 11.6-2.1L20 12M4 12l2.3 5.1A7 7 0 0 0 17.9 15" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function AdminRefreshButton({
  onRefresh,
  isRefreshing,
  label = "새로고침",
}: AdminRefreshButtonProps) {
  return (
    <button
      type="button"
      onClick={onRefresh}
      disabled={isRefreshing}
      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-ufo-divider bg-ufo-surface px-3 text-xs font-semibold text-ufo-text-secondary disabled:cursor-wait disabled:opacity-60"
      aria-label={isRefreshing ? `${label} 중` : label}
    >
      <RefreshIcon isRefreshing={isRefreshing} />
      <span>{isRefreshing ? "불러오는 중" : label}</span>
    </button>
  );
}
