"use client";

import Image from "next/image";
import Link from "next/link";
import SlidersIcon from "@/components/icons/SlidersIcon";
import type { ChatRoomFilter } from "@/features/chat/constants";
import type { ChatRoom } from "@/features/chat/types";

type ChatRoomListProps = {
  title: string;
  rooms: ChatRoom[];
  emptyText: string;
  filters?: readonly ChatRoomFilter[];
  activeFilter?: ChatRoomFilter;
  onFilterChange?: (filter: ChatRoomFilter) => void;
  showSettingsButton?: boolean;
  isSettingsMode?: boolean;
  updatingRoomId?: string | null;
  onSettingsClick?: () => void;
  onFavoriteChange?: (room: ChatRoom) => void;
  onHiddenChange?: (room: ChatRoom) => void;
};

function FavoriteIcon() {
  return <span className="text-ufo-brand-soft" aria-hidden="true">★</span>;
}

function ChatRoomSummary({ room }: { room: ChatRoom }) {
  return (
    <>
      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-[6px] bg-[#f4e9e5]">
        {room.imageUrl ? (
          <Image
            src={room.imageUrl}
            alt=""
            fill
            sizes="48px"
            className="object-cover"
            aria-hidden="true"
          />
        ) : null}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-base font-semibold leading-tight text-[#666666]">{room.name}</p>
          {room.favorite ? <FavoriteIcon /> : null}
        </div>
        <p className="mt-1 text-xs leading-none text-ufo-text-dim">
          {room.favorite ? "즐겨찾기 채팅방" : room.isHidden ? "FO 보관 채팅방" : "채팅방"}
        </p>
      </div>

      {room.unreadCount > 0 ? (
        <span className="inline-flex min-w-10 items-center justify-center rounded-full bg-[#ff2d2d] px-2 py-1 text-base font-semibold leading-none text-white">
          {room.unreadCount}
        </span>
      ) : null}
    </>
  );
}

function StatusToggleButton({
  active,
  disabled,
  label,
  onClick,
}: {
  active: boolean;
  disabled: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={`h-8 rounded-full border px-3 text-xs font-semibold disabled:opacity-50 ${
        active
          ? "border-ufo-brand text-ufo-brand"
          : "border-ufo-border-light text-ufo-text-neutral"
      }`}
    >
      {label}
    </button>
  );
}

function ChatRoomItem({
  room,
  isSettingsMode,
  isUpdating,
  onFavoriteChange,
  onHiddenChange,
}: {
  room: ChatRoom;
  isSettingsMode: boolean;
  isUpdating: boolean;
  onFavoriteChange?: (room: ChatRoom) => void;
  onHiddenChange?: (room: ChatRoom) => void;
}) {
  if (isSettingsMode) {
    return (
      <li className="border-b border-[#e5e5e5] px-4 py-3">
        <div className="flex items-center gap-3">
          <ChatRoomSummary room={room} />
        </div>
        <div className="mt-3 flex justify-end gap-2">
          <StatusToggleButton
            active={room.favorite}
            disabled={isUpdating}
            label="즐겨찾기"
            onClick={() => onFavoriteChange?.(room)}
          />
          <StatusToggleButton
            active={room.isHidden}
            disabled={isUpdating}
            label="FO"
            onClick={() => onHiddenChange?.(room)}
          />
        </div>
      </li>
    );
  }

  return (
    <li className="border-b border-[#e5e5e5]">
      <Link
        href={`/chats/${room.patternId}`}
        className="flex items-center gap-3 px-4 py-3"
        aria-label={`${room.name} 채팅방 입장`}
      >
        <ChatRoomSummary room={room} />
      </Link>
    </li>
  );
}

export default function ChatRoomList({
  title,
  rooms,
  emptyText,
  filters,
  activeFilter,
  onFilterChange,
  showSettingsButton = false,
  isSettingsMode = false,
  updatingRoomId = null,
  onSettingsClick,
  onFavoriteChange,
  onHiddenChange,
}: ChatRoomListProps) {
  return (
    <section aria-label={`${title} 섹션`}>
      <div className="mb-3 flex items-center justify-between px-4 pt-3">
        <h2 className="text-sm font-bold text-[#222222]">{title}</h2>
        {showSettingsButton ? (
          <button
            type="button"
            onClick={onSettingsClick}
            aria-pressed={isSettingsMode}
            className={`rounded-full p-1 ${
              isSettingsMode ? "text-ufo-brand" : "text-[#f2a4aa]"
            }`}
            aria-label="채팅방 설정"
          >
            <SlidersIcon />
          </button>
        ) : null}
      </div>

      {filters && filters.length > 0 ? (
        <ul
          className="mb-3 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label="채팅방 필터"
        >
          {filters.map((chip) => (
            <li key={chip} className="shrink-0">
              <button
                type="button"
                onClick={() => onFilterChange?.(chip)}
                aria-pressed={activeFilter === chip}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  (activeFilter ?? filters[0]) === chip
                    ? "bg-[#fff1ed] text-ufo-brand"
                    : "bg-[#fff1ed] text-ufo-text-neutral"
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
          rooms.map((room) => (
            <ChatRoomItem
              key={room.patternId}
              room={room}
              isSettingsMode={isSettingsMode}
              isUpdating={updatingRoomId !== null}
              onFavoriteChange={onFavoriteChange}
              onHiddenChange={onHiddenChange}
            />
          ))
        ) : (
          <li className="py-8 text-center text-sm text-ufo-text-subtle">{emptyText}</li>
        )}
      </ul>
    </section>
  );
}
