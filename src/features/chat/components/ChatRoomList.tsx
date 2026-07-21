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
  updatingRoomIds?: ReadonlySet<string>;
  onSettingsClick?: () => void;
  onFavoriteChange?: (room: ChatRoom) => void;
  onHiddenChange?: (room: ChatRoom) => void;
};

function FavoriteIcon() {
  return <span className="text-ufo-brand-soft" aria-hidden="true">★</span>;
}

function CheckIcon() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M4.5 10.3L8.2 14L15.5 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChatRoomSummary({ room }: { room: ChatRoom }) {
  return (
    <>
      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-[6px] bg-ufo-chat-thumbnail">
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
          <p className="truncate text-base font-semibold leading-tight text-ufo-text-secondary">{room.name}</p>
          {room.favorite ? <FavoriteIcon /> : null}
        </div>
        <p className="mt-1 truncate text-xs leading-none text-ufo-text-dim">
          내 이름: {room.nickname}
        </p>
        <p className="mt-1 truncate text-xs leading-none text-ufo-text-dim">
          {room.lastMessage}
        </p>
      </div>

      {room.unreadCount > 0 ? (
        <span className="inline-flex min-w-10 items-center justify-center rounded-full bg-ufo-chat-unread px-2 py-1 text-base font-semibold leading-none text-white">
          {room.unreadCount > 99 ? "99+" : room.unreadCount}
        </span>
      ) : null}
    </>
  );
}

function StatusToggleButton({
  active,
  disabled,
  label,
  ariaLabel,
  onClick,
}: {
  active: boolean;
  disabled: boolean;
  label: string;
  ariaLabel: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      aria-label={ariaLabel}
      className={`min-h-11 rounded-full border px-3 text-xs font-semibold disabled:opacity-50 ${
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
      <li className="border-b border-ufo-divider px-4 py-3">
        <div className="flex items-center gap-3">
          <ChatRoomSummary room={room} />
          <div className="flex shrink-0 gap-2">
            <StatusToggleButton
              active={room.favorite}
              disabled={isUpdating}
              label="즐겨찾기"
              ariaLabel={`${room.name} 채팅방 즐겨찾기`}
              onClick={() => onFavoriteChange?.(room)}
            />
            <StatusToggleButton
              active={room.isHidden}
              disabled={isUpdating}
              label="FO"
              ariaLabel={`${room.name} 채팅방 FO`}
              onClick={() => onHiddenChange?.(room)}
            />
          </div>
        </div>
      </li>
    );
  }

  return (
    <li className="border-b border-ufo-divider">
      <Link
        href={`/chats/${room.chatId}`}
        className="flex items-center gap-3 px-4 py-3"
        aria-label={`${room.name} 채팅방, 내 이름 ${room.nickname}, 읽지 않은 메시지 ${room.unreadCount > 99 ? "99개 이상" : `${room.unreadCount}개`}, 마지막 메시지 ${room.lastMessage || "없음"}`}
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
  updatingRoomIds = new Set<string>(),
  onSettingsClick,
  onFavoriteChange,
  onHiddenChange,
}: ChatRoomListProps) {
  return (
    <section aria-label={`${title} 섹션`}>
      <div className="mb-3 flex items-center justify-between px-4 pt-3">
        <h2 className="text-sm font-bold text-ufo-text">{title}</h2>
        {showSettingsButton ? (
          <button
            type="button"
            onClick={onSettingsClick}
            aria-pressed={isSettingsMode}
            className={`flex h-11 w-11 items-center justify-center rounded-full ${
              isSettingsMode ? "text-ufo-brand" : "text-ufo-brand"
            }`}
            aria-label={isSettingsMode ? "채팅방 설정 완료" : "채팅방 설정"}
          >
            {isSettingsMode ? <CheckIcon /> : <SlidersIcon />}
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
                className={`min-h-11 rounded-full px-3 py-1 text-xs font-semibold ${
                  (activeFilter ?? filters[0]) === chip
                    ? "bg-ufo-brand-pale text-ufo-brand"
                    : "bg-ufo-brand-pale text-ufo-text-neutral"
                }`}
                aria-label={`${chip} 필터`}
              >
                {chip}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <ul aria-label={`${title} 목록`} className="border-t border-ufo-divider">
        {rooms.length > 0 ? (
          rooms.map((room) => (
            <ChatRoomItem
              key={room.chatId}
              room={room}
              isSettingsMode={isSettingsMode}
              isUpdating={updatingRoomIds.has(room.chatId)}
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
