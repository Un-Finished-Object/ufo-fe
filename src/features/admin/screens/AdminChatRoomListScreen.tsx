"use client";

import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import Pagination from "@/components/common/Pagination";
import SearchBar from "@/components/common/SearchBar";
import StateBlock from "@/components/common/StateBlock";
import AdminRefreshButton from "@/features/admin/components/AdminRefreshButton";
import { adminChatListQueryOptions } from "@/features/admin/queries/adminChatQueries";

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

function getLastMessageLabel(room: { lastMessage: string; lastMessageDeleted?: boolean }) {
  return room.lastMessageDeleted ? "삭제한 메시지입니다" : room.lastMessage || "메시지가 없습니다.";
}

export default function AdminChatRoomListScreen({ chatRoute }: { chatRoute: string }) {
  const [query, setQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const chatsQuery = useQuery(adminChatListQueryOptions(currentPage));
  const rooms = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const chats = chatsQuery.data?.chats ?? [];
    if (!normalizedQuery) return chats;

    return chats.filter((room) =>
      [room.name, String(room.chatId), String(room.patternId), getLastMessageLabel(room)]
        .some((value) => value.toLowerCase().includes(normalizedQuery)),
    );
  }, [chatsQuery.data?.chats, query]);
  const responsePage = chatsQuery.data?.page ?? currentPage;
  const nextPages = chatsQuery.data?.nextPages ?? 0;

  return (
    <div className="px-4 py-5 md:px-8 md:py-8">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-ufo-brand">채팅 운영</p>
          <h2 className="mt-1 text-xl font-bold tracking-tight text-ufo-text">채팅 내역 관리</h2>
          <p className="mt-2 text-sm text-ufo-text-subtle">최근 메시지 순서로 채팅방을 확인합니다.</p>
        </div>
        <AdminRefreshButton
          onRefresh={() => void chatsQuery.refetch()}
          isRefreshing={chatsQuery.isFetching}
        />
      </div>

      <section className="overflow-hidden rounded-2xl border border-ufo-divider bg-ufo-surface" aria-labelledby="admin-chat-list-title">
        <div className="border-b border-ufo-divider px-1 py-1 md:flex md:items-center md:justify-between md:px-5 md:py-3">
          <div className="flex items-center justify-between px-3 pt-3 md:px-0 md:pt-0">
            <h3 id="admin-chat-list-title" className="text-sm font-bold text-ufo-text">채팅방 목록</h3>
            {!chatsQuery.isPending ? <span className="ml-2 text-xs text-ufo-text-dim">현재 페이지 {rooms.length}개</span> : null}
          </div>
          <div className="md:w-[360px]">
            <SearchBar
              value={query}
              onChange={setQuery}
              placeholder="채팅방, ID 또는 메시지 검색"
              disabled={chatsQuery.isPending}
            />
          </div>
        </div>

        {chatsQuery.isPending ? (
          <StateBlock type="loading" title="채팅방을 불러오고 있어요." className="px-4 py-12" />
        ) : chatsQuery.isError ? (
          <StateBlock
            type="error"
            title="채팅방을 불러오지 못했어요."
            description="잠시 후 다시 시도해 주세요."
            actionLabel="다시 시도"
            onAction={() => void chatsQuery.refetch()}
            className="px-4 py-12"
          />
        ) : rooms.length > 0 ? (
          <>
            <ul className="md:hidden">
              {rooms.map((room) => (
                <li key={room.chatId} className="border-b border-ufo-divider">
                  <Link href={`${chatRoute}/${room.chatId}`} className="block px-4 py-4" aria-label={`${room.name} 채팅 내역 보기`}>
                    <div className="flex items-start gap-3">
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-ufo-chat-thumbnail">
                        {room.imageUrl ? <Image src={room.imageUrl} alt="" fill sizes="56px" className="object-cover" /> : <span className="flex h-full items-center justify-center text-xs font-bold text-ufo-brand">UFO</span>}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="truncate text-base font-semibold text-ufo-text">{room.name}</h4>
                          <time dateTime={room.lastMessageAt} className="shrink-0 text-[11px] text-ufo-text-dim">{formatDateTime(room.lastMessageAt)}</time>
                        </div>
                        <p className="mt-1 text-xs text-ufo-text-subtle">채팅방 {room.chatId} · 도안 {room.patternId}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <p className="min-w-0 flex-1 truncate text-sm text-ufo-text-secondary">{getLastMessageLabel(room)}</p>
                          {room.unreadCount > 0 ? <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-ufo-chat-unread px-1 text-[10px] font-bold text-ufo-surface" aria-label={`읽지 않은 메시지 ${room.unreadCount}개`}>{room.unreadCount}</span> : null}
                        </div>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[820px] border-collapse text-left text-sm">
                <thead className="bg-ufo-brand-pale text-xs font-semibold text-ufo-text-secondary">
                  <tr>
                    <th scope="col" className="px-5 py-3">채팅방</th>
                    <th scope="col" className="px-5 py-3">식별 정보</th>
                    <th scope="col" className="px-5 py-3">최근 메시지</th>
                    <th scope="col" className="px-5 py-3 text-center">미확인</th>
                    <th scope="col" className="px-5 py-3">최근 활동</th>
                    <th scope="col" className="px-5 py-3"><span className="sr-only">상세 보기</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ufo-divider">
                  {rooms.map((room) => (
                    <tr key={room.chatId} className="hover:bg-ufo-bg/60">
                      <td className="px-5 py-4"><div className="flex items-center gap-3"><div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-ufo-chat-thumbnail">{room.imageUrl ? <Image src={room.imageUrl} alt="" fill sizes="44px" className="object-cover" /> : null}</div><p className="max-w-56 truncate font-semibold text-ufo-text">{room.name}</p></div></td>
                      <td className="px-5 py-4 text-xs leading-5 text-ufo-text-secondary"><p>채팅방 {room.chatId}</p><p>도안 {room.patternId}</p></td>
                      <td className="max-w-72 px-5 py-4"><p className="truncate text-xs text-ufo-text-secondary">{getLastMessageLabel(room)}</p></td>
                      <td className="px-5 py-4 text-center">{room.unreadCount > 0 ? <span className="inline-flex min-h-6 min-w-6 items-center justify-center rounded-full bg-ufo-chat-unread px-1 text-[10px] font-bold text-ufo-surface">{room.unreadCount}</span> : <span className="text-ufo-text-dim">-</span>}</td>
                      <td className="px-5 py-4 text-xs text-ufo-text-secondary">{formatDateTime(room.lastMessageAt)}</td>
                      <td className="px-5 py-4 text-right"><Link href={`${chatRoute}/${room.chatId}`} className="inline-flex min-h-9 items-center rounded-lg border border-ufo-border px-3 text-xs font-semibold text-ufo-brand">상세 보기</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <StateBlock
            type="empty"
            title={query ? "조건에 맞는 채팅방이 없습니다." : "표시할 채팅방이 없습니다."}
            className="px-4 py-12"
          />
        )}

        {!chatsQuery.isPending && !chatsQuery.isError && !query ? (
          <Pagination currentPage={responsePage} nextPage={nextPages} onPageChange={setCurrentPage} />
        ) : null}
      </section>
    </div>
  );
}
