"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import Pagination from "@/components/common/Pagination";
import ToastMessage from "@/components/common/ToastMessage";
import YesOrNo from "@/components/dialogs/YesOrNo";
import ChatRoomList from "@/features/chat/components/ChatRoomList";
import SearchBar from "@/components/common/SearchBar";
import TopBar from "@/components/navigation/TopBar";
import { chatRoomFilters, type ChatRoomFilter } from "@/features/chat/constants";
import { useMeQuery } from "@/features/auth/hooks/useMeQuery";
import { chatStatusQueryKey, type ChatStatus } from "@/features/chat/hooks/useChatStatusQuery";
import {
  myChatRoomsQueryKey,
  myChatRoomsQueryOptions,
  type MyChatRoomsResult,
} from "@/features/chat/queries/chatQueries";
import { patchChatStatus } from "@/features/chat/services/patchChatStatus";
import type { ChatRoom } from "@/features/chat/types";
import { useAuthRequiredToast } from "@/hooks/useAuthRequiredToast";
import { isApiError } from "@/lib/api/ApiError";

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
  const [activeFilter, setActiveFilter] = useState<ChatRoomFilter>("UFO");
  const [isSettingsMode, setIsSettingsMode] = useState(false);
  const [foConfirmRoom, setFoConfirmRoom] = useState<ChatRoom | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const normalizedQuery = query.trim().toLowerCase();
  const { showAuthRequiredToast, toastMessage } = useAuthRequiredToast();
  const meQuery = useMeQuery();
  const queryClient = useQueryClient();
  const myChatRoomsQuery = useQuery(
    myChatRoomsQueryOptions({ enabled: Boolean(meQuery.data), page: currentPage }),
  );
  const updateChatStatusMutation = useMutation({
    mutationFn: ({
      favorite,
      hidden,
      room,
    }: {
      favorite?: boolean;
      hidden?: boolean;
      room: ChatRoom;
    }) =>
      patchChatStatus({
        chatId: room.chatId,
        favorite,
        hidden,
      }),
    onSuccess: (nextChatStatus, { room }) => {
      queryClient.setQueryData<ChatStatus | null>(
        chatStatusQueryKey(room.chatId),
        nextChatStatus,
      );
      queryClient.setQueriesData<MyChatRoomsResult>(
        { queryKey: myChatRoomsQueryKey },
        (previousResult) =>
          previousResult
            ? {
                ...previousResult,
                rooms: previousResult.rooms.map((previousRoom) =>
                  previousRoom.chatId === room.chatId
                    ? {
                        ...previousRoom,
                        favorite: nextChatStatus.favorite,
                        isHidden: nextChatStatus.isHidden,
                      }
                    : previousRoom,
                ),
              }
            : previousResult,
      );
    },
    onError: (error) => {
      if (isApiError(error, 401)) {
        showAuthRequiredToast();
      }
    },
  });

  useEffect(() => {
    if (!meQuery.isPending && !meQuery.isError && !meQuery.data) {
      showAuthRequiredToast();
    }
  }, [meQuery.data, meQuery.isError, meQuery.isPending, showAuthRequiredToast]);

  const filteredMyRooms = useMemo(() => {
    const searchedRooms = (myChatRoomsQuery.data?.rooms ?? []).filter((room) =>
      room.name.toLowerCase().includes(normalizedQuery),
    );

    if (activeFilter === "즐겨찾기") {
      return searchedRooms.filter((room) => room.favorite);
    }

    if (activeFilter === "안읽음") {
      return searchedRooms.filter((room) => room.unreadCount > 0);
    }

    if (activeFilter === "FO") {
      return searchedRooms.filter((room) => room.isHidden);
    }

    return searchedRooms.filter((room) => !room.isHidden);
  }, [activeFilter, myChatRoomsQuery.data, normalizedQuery]);

  const nickname = meQuery.data?.nickname ?? "회원";
  const isChatRoomsLoading = Boolean(meQuery.data) && myChatRoomsQuery.isPending;
  const isChatRoomsError = Boolean(meQuery.data) && myChatRoomsQuery.isError;
  const chatRoomsPage = myChatRoomsQuery.data?.page ?? currentPage;
  const nextPage = myChatRoomsQuery.data?.nextPage ?? 0;
  const updatingRoomId = updateChatStatusMutation.isPending
    ? updateChatStatusMutation.variables.room.chatId
    : null;

  const handleFilterChange = (filter: ChatRoomFilter) => {
    setActiveFilter(filter);
    setCurrentPage(1);
  };

  const handleSearchChange = (nextQuery: string) => {
    setQuery(nextQuery);
    setCurrentPage(1);
  };

  const handleSettingsClick = () => {
    setIsSettingsMode((currentIsSettingsMode) => !currentIsSettingsMode);
  };

  const handleFavoriteChange = (room: ChatRoom) => {
    if (updateChatStatusMutation.isPending) {
      return;
    }

    if (!meQuery.data) {
      showAuthRequiredToast();
      return;
    }

    updateChatStatusMutation.mutate({
      room,
      favorite: !room.favorite,
    });
  };

  const handleHiddenChange = (room: ChatRoom) => {
    if (updateChatStatusMutation.isPending) {
      return;
    }

    if (!meQuery.data) {
      showAuthRequiredToast();
      return;
    }

    setFoConfirmRoom(room);
  };

  const handleConfirmFoChange = () => {
    if (!foConfirmRoom) {
      return;
    }

    if (!meQuery.data) {
      showAuthRequiredToast();
      setFoConfirmRoom(null);
      return;
    }

    updateChatStatusMutation.mutate({
      room: foConfirmRoom,
      hidden: !foConfirmRoom.isHidden,
    });
    setFoConfirmRoom(null);
  };

  const handleCloseFoConfirm = () => {
    setFoConfirmRoom(null);
  };

  const foConfirmMainText = foConfirmRoom?.isHidden
    ? "이 채팅방의 매듭을 푸시겠습니까?"
    : "이 채팅방을 매듭짓겠습니까?";
  const foConfirmSubText = foConfirmRoom?.isHidden ? (
    <>{"'나의 채팅방'에서 채팅방을 확인할 수 있습니다."}</>
  ) : (
    <>
      <p>{"'나의 채팅방 > FO'에서 채팅방을 확인할 수 있습니다."}</p>
      <p className="mt-1">{"*FO 버튼을 한 번 더 누르면 다시 불러올 수 있습니다."}</p>
    </>
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

        <SearchBar value={query} onChange={handleSearchChange} placeholder="채팅방명을 검색하세요" />

        <section className="border-b border-ufo-border-light px-8 pb-2" aria-label="채팅 사용자 정보">
          <h2 className="flex items-center gap-1.5 text-sm font-semibold text-ufo-text-subtle">
            <span className="inline-block h-3 w-3 rounded-full bg-[#f8a8a8]" aria-hidden="true" />
            {nickname}님
          </h2>
        </section>

        {isChatRoomsLoading ? <LoadingState /> : null}
        {isChatRoomsError ? <ErrorState onRetry={() => void myChatRoomsQuery.refetch()} /> : null}

        {!isChatRoomsLoading && !isChatRoomsError ? (
          <>
            <ChatRoomList
              title="나의 채팅방"
              rooms={filteredMyRooms}
              filters={chatRoomFilters}
              activeFilter={activeFilter}
              onFilterChange={handleFilterChange}
              showSettingsButton
              isSettingsMode={isSettingsMode}
              updatingRoomId={updatingRoomId}
              onSettingsClick={handleSettingsClick}
              onFavoriteChange={handleFavoriteChange}
              onHiddenChange={handleHiddenChange}
              emptyText="검색 결과가 없습니다."
            />
            <Pagination
              currentPage={chatRoomsPage}
              nextPage={nextPage}
              onPageChange={setCurrentPage}
            />
          </>
        ) : null}
      </main>
      {foConfirmRoom ? (
        <YesOrNo
          mainText={foConfirmMainText}
          subText={foConfirmSubText}
          yesDisabled={updateChatStatusMutation.isPending}
          noDisabled={updateChatStatusMutation.isPending}
          onYes={handleConfirmFoChange}
          onNo={handleCloseFoConfirm}
        />
      ) : null}
      <ToastMessage message={toastMessage} />
    </div>
  );
}
