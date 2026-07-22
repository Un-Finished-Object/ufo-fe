type ChatDateSeparatorProps = {
  createdAt: string;
};

function formatChatDate(createdAt: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(new Date(createdAt));
}

export default function ChatDateSeparator({
  createdAt,
}: ChatDateSeparatorProps) {
  const label = formatChatDate(createdAt);

  return (
    <div className="flex items-center gap-3 py-2" role="separator" aria-label={label}>
      <span className="h-px flex-1 bg-ufo-border-light" aria-hidden="true" />
      <time dateTime={createdAt} className="shrink-0 text-[11px] font-medium text-ufo-text-dim">
        {label}
      </time>
      <span className="h-px flex-1 bg-ufo-border-light" aria-hidden="true" />
    </div>
  );
}
