"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import ChatRoomList from "@/features/chat/components/ChatRoomList";
import SearchBar from "@/components/common/SearchBar";
import TopBar from "@/components/navigation/TopBar";
import { chatRoomFilters } from "@/features/chat/constants";
import { useMeQuery } from "@/features/auth/hooks/useMeQuery";
import { myChatRoomsQueryOptions } from "@/features/chat/queries/chatQueries";

function LoadingState() {
  return <p className="px-4 py-8 text-sm text-ufo-text-dim">채팅방 목록을 불러오는 중입니다.</p>;
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="px-4 py-8">
      <div className="rounded-2xl border border-ufo-border bg-white px-5 py-6 text-center">
        <p className="text-sm font-semibold text-ufo-text">채팅방 목록을 불러오지 못했어요.</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-xl bg-ufo-brand-soft px-4 py-2 text-sm font-semibold text-white"
        >
          다시 시도
        </button>
      </div>
    </div>
  );
}

export default function ChatRoomDirectoryScreen() {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const meQuery = useMeQuery();
  const myChatRoomsQuery = useQuery(myChatRoomsQueryOptions());

  const filteredMyRooms = useMemo(
    () =>
      (myChatRoomsQuery.data ?? []).filter(
        (room) => !room.isHidden && room.name.toLowerCase().includes(normalizedQuery),
      ),
    [myChatRoomsQuery.data, normalizedQuery],
  );

  const filteredFoRooms = useMemo(
    () =>
      (myChatRoomsQuery.data ?? []).filter(
        (room) => room.isHidden && room.name.toLowerCase().includes(normalizedQuery),
      ),
    [myChatRoomsQuery.data, normalizedQuery],
  );

  const nickname = meQuery.data?.nickname ?? "회원";

  return (
    <div className="min-h-screen bg-ufo-bg">
      <main className="mx-auto min-h-screen w-full max-w-[430px] bg-ufo-surface text-ufo-text">
        <TopBar
          left="back"
          leftHref="/"
          title="채팅방"
          right={[{ type: "home", href: "/", ariaLabel: "홈" }]}
          showBottomBorder
        />

        <SearchBar value={query} onChange={setQuery} placeholder="채팅방명을 검색하세요" />

        <section className="border-b border-ufo-border-light px-8 pb-2" aria-label="채팅 사용자 정보">
          <h2 className="flex items-center gap-1.5 text-sm font-semibold text-ufo-text-subtle">
            <span className="inline-block h-3 w-3 rounded-full bg-[#f8a8a8]" aria-hidden="true" />
            {nickname}님
          </h2>
        </section>

        {myChatRoomsQuery.isPending ? <LoadingState /> : null}
        {myChatRoomsQuery.isError ? <ErrorState onRetry={() => void myChatRoomsQuery.refetch()} /> : null}

        {!myChatRoomsQuery.isPending && !myChatRoomsQuery.isError ? (
          <>
            <ChatRoomList
              title="나의 채팅방"
              rooms={filteredMyRooms}
              filters={[...chatRoomFilters]}
              showSettingsButton
              emptyText="검색 결과가 없습니다."
            />

            <div className="px-4 pt-3">
              <ChatRoomList
                title="FO"
                rooms={filteredFoRooms}
                emptyText="FO 채팅방이 없습니다."
              />
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
}
