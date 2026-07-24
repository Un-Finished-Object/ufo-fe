import { forwardRef } from "react";

const AdminChatLastReadSeparator = forwardRef<HTMLDivElement>(
  function AdminChatLastReadSeparator(_, ref) {
    return (
      <div
        ref={ref}
        className="my-4 flex items-center gap-3"
        role="separator"
        aria-label="마지막으로 읽은 메시지입니다"
      >
        <span className="h-px flex-1 bg-ufo-border" aria-hidden="true" />
        <span className="shrink-0 text-[10px] font-semibold text-ufo-brand">
          마지막으로 읽은 메시지입니다
        </span>
        <span className="h-px flex-1 bg-ufo-border" aria-hidden="true" />
      </div>
    );
  },
);

export default AdminChatLastReadSeparator;
