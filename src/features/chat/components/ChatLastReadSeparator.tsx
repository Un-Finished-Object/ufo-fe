import { forwardRef } from "react";

const ChatLastReadSeparator = forwardRef<HTMLDivElement>(function ChatLastReadSeparator(_, ref) {
  return (
    <div
      ref={ref}
      className="flex items-center gap-3 py-2"
      role="separator"
      aria-label="마지막으로 읽은 메시지입니다"
    >
      <span className="h-px flex-1 bg-ufo-border" aria-hidden="true" />
      <span className="shrink-0 text-[11px] font-medium text-ufo-brand">
        마지막으로 읽은 메시지입니다
      </span>
      <span className="h-px flex-1 bg-ufo-border" aria-hidden="true" />
    </div>
  );
});

export default ChatLastReadSeparator;
