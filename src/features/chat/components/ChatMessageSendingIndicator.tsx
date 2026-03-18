export default function ChatMessageSendingIndicator() {
  return (
    <span
      className="inline-flex h-4 w-4 shrink-0 items-center justify-center self-center text-ufo-text-dim"
      aria-label="메시지 전송중"
    >
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-ufo-border border-t-ufo-brand" />
    </span>
  );
}
