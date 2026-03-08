"use client";

import { useMemo, useState } from "react";
import SearchBar from "@/components/SearchBar";
import TopBar from "@/components/TopBar";
import ChatRoomList from "@/features/chat/components/ChatRoomList";
import { chatFilterChips, myChatRooms, popularChatRooms } from "@/features/chat/mock-data";

export default function ChatsMainScreen() {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();

  const filteredMyRooms = useMemo(
    () => myChatRooms.filter((room) => room.name.toLowerCase().includes(normalizedQuery)),
    [normalizedQuery]
  );

  const filteredPopularRooms = useMemo(
    () => popularChatRooms.filter((room) => room.name.toLowerCase().includes(normalizedQuery)),
    [normalizedQuery]
  );

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
            뜨개람쥐님
          </h2>
        </section>

        <ChatRoomList
          title="나의 채팅방"
          rooms={filteredMyRooms}
          filters={chatFilterChips}
          showSettingsButton
          emptyText="검색 결과가 없습니다."
        />

        <div className="px-4 pt-3">
          <ChatRoomList
            title="인기 채팅방"
            rooms={filteredPopularRooms}
            emptyText="검색 결과가 없습니다."
          />
        </div>
      </main>
    </div>
  );
}
