import Link from "next/link";
import type { ChatRoom } from "@/features/chat/types";

type ChatRoomListProps = {
  title: string;
  rooms: ChatRoom[];
  emptyText: string;
  filters?: string[];
  showSettingsButton?: boolean;
};

function SettingsIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-6 w-6"
      aria-hidden="true"
    >
      <path d="M19.14 12.94a7.49 7.49 0 0 0 .05-.94 7.49 7.49 0 0 0-.05-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.03 7.03 0 0 0-1.63-.94l-.36-2.54a.5.5 0 0 0-.5-.42h-3.84a.5.5 0 0 0-.5.42l-.36 2.54c-.58.23-1.13.54-1.63.94l-2.39-.96a.5.5 0 0 0-.6.22L2.7 8.84a.5.5 0 0 0 .12.64l2.03 1.58c-.03.31-.05.63-.05.94 0 .31.02.63.05.94L2.82 14.52a.5.5 0 0 0-.12.64l1.92 3.32a.5.5 0 0 0 .6.22l2.39-.96c.5.4 1.05.72 1.63.94l.36 2.54a.5.5 0 0 0 .5.42h3.84a.5.5 0 0 0 .5-.42l.36-2.54c.58-.23 1.13-.54 1.63-.94l2.39.96a.5.5 0 0 0 .6-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58ZM12 15.5A3.5 3.5 0 1 1 12 8a3.5 3.5 0 0 1 0 7.5Z" />
    </svg>
  );
}

function ChatRoomItem({ room }: { room: ChatRoom }) {
  return (
    <li className="border-b border-[#e5e5e5]">
      <Link
        href={`/chats/${room.patternId}`}
        className="flex items-center gap-3 px-4 py-3"
        aria-label={`${room.name} 채팅방 입장`}
      >
        <div className="h-12 w-12 shrink-0 rounded-[6px] bg-[#f4e9e5]" aria-hidden="true" />

        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold leading-tight text-[#666666]">{room.name}</p>
          <p className="mt-0.5 text-xs leading-none text-ufo-text-dim">{room.participants}</p>
          <p className="mt-1 text-xs leading-none text-[#f29aa4]">{room.statusText}</p>
        </div>

        <span className="inline-flex min-w-10 items-center justify-center rounded-full bg-[#ff2d2d] px-2 py-1 text-base font-semibold leading-none text-white">
          {room.unreadCount}
        </span>
      </Link>
    </li>
  );
}

export default function ChatRoomList({
  title,
  rooms,
  emptyText,
  filters,
  showSettingsButton = false,
}: ChatRoomListProps) {
  return (
    <section aria-label={`${title} 섹션`}>
      <div className="mb-3 flex items-center justify-between px-4 pt-3">
        <h2 className="text-sm font-bold text-[#222222]">{title}</h2>
        {showSettingsButton ? (
          <button
            type="button"
            className="rounded-full p-1 text-[#f2a4aa]"
            aria-label="채팅방 설정"
          >
            <SettingsIcon />
          </button>
        ) : null}
      </div>

      {filters && filters.length > 0 ? (
        <ul
          className="mb-3 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label="채팅방 필터"
        >
          {filters.map((chip, index) => (
            <li key={chip} className="shrink-0">
              <button
                type="button"
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  index === 0 ? "bg-ufo-brand-pale text-white" : "bg-[#fff1ed] text-ufo-text-neutral"
                }`}
                aria-label={`${chip} 필터`}
              >
                {chip}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <ul aria-label={`${title} 목록`} className="border-t border-[#e5e5e5]">
        {rooms.length > 0 ? (
          rooms.map((room) => <ChatRoomItem key={room.patternId} room={room} />)
        ) : (
          <li className="py-8 text-center text-sm text-ufo-text-subtle">{emptyText}</li>
        )}
      </ul>
    </section>
  );
}
