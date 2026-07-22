"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Pagination from "@/components/common/Pagination";
import StateBlock from "@/components/common/StateBlock";
import ToastMessage from "@/components/common/ToastMessage";
import YesOrNo from "@/components/dialogs/YesOrNo";
import MobileShell from "@/components/layout/MobileShell";
import ChatRoomList from "@/features/chat/components/ChatRoomList";
import SearchBar from "@/components/common/SearchBar";
import TopBar from "@/components/navigation/TopBar";
import { chatRoomFilters, type ChatRoomFilter } from "@/features/chat/constants";
import { useMeQuery } from "@/features/auth/hooks/useMeQuery";
import { useAllMyChatRoomsQuery } from "@/features/chat/hooks/useAllMyChatRoomsQuery";
import { chatStatusQueryKey, type ChatStatus } from "@/features/chat/hooks/useChatStatusQuery";
import { updateChatRoomCaches } from "@/features/chat/lib/chatRoomCache";
import {
  myChatRoomsQueryOptions,
} from "@/features/chat/queries/chatQueries";
import { patchChatStatus } from "@/features/chat/services/patchChatStatus";
import type { ChatRoom } from "@/features/chat/types";
import { useAuthRequiredToast } from "@/hooks/useAuthRequiredToast";

export default function ChatRoomDirectoryScreen() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<ChatRoomFilter>("UFO");
  const [isSettingsMode, setIsSettingsMode] = useState(false);
  const [foConfirmRoom, setFoConfirmRoom] = useState<ChatRoom | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [updatingRoomIds, setUpdatingRoomIds] = useState<Set<string>>(() => new Set());
  const normalizedQuery = query.trim().toLowerCase();
  const { showToast, toastMessage } = useAuthRequiredToast();
  const meQuery = useMeQuery();
  const allChatRoomsQuery = useAllMyChatRoomsQuery({ enabled: Boolean(meQuery.data) });
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
    onMutate: ({ favorite, hidden, room }) => {
      setUpdatingRoomIds((currentRoomIds) => new Set(currentRoomIds).add(room.chatId));
      const previousStatus = queryClient.getQueryData<ChatStatus | null>(
        chatStatusQueryKey(room.chatId),
      );
      const optimisticFavorite = favorite ?? room.favorite;
      const optimisticHidden = hidden ?? room.isHidden;

      queryClient.setQueryData<ChatStatus | null>(chatStatusQueryKey(room.chatId), {
        chatId: Number(room.chatId),
        favorite: optimisticFavorite,
        isHidden: optimisticHidden,
      });
      updateChatRoomCaches(queryClient, room.chatId, (previousRoom) => ({
        ...previousRoom,
        favorite: optimisticFavorite,
        isHidden: optimisticHidden,
      }));

      return { previousRoom: room, previousStatus };
    },
    onSuccess: (nextChatStatus, { room }) => {
      queryClient.setQueryData<ChatStatus | null>(
        chatStatusQueryKey(room.chatId),
        nextChatStatus,
      );
      updateChatRoomCaches(queryClient, room.chatId, (previousRoom) => ({
        ...previousRoom,
        favorite: nextChatStatus.favorite,
        isHidden: nextChatStatus.isHidden,
      }));
    },
    onError: (_error, { room }, context) => {
      queryClient.setQueryData(
        chatStatusQueryKey(room.chatId),
        context?.previousStatus ?? null,
      );

      if (context?.previousRoom) {
        updateChatRoomCaches(queryClient, room.chatId, (currentRoom) => ({
          ...currentRoom,
          favorite: context.previousRoom.favorite,
          isHidden: context.previousRoom.isHidden,
        }));
      }

      showToast("채팅방 상태를 변경하지 못했습니다. 다시 시도해 주세요.");
    },
    onSettled: (_data, _error, { room }) => {
      setUpdatingRoomIds((currentRoomIds) => {
        const nextRoomIds = new Set(currentRoomIds);
        nextRoomIds.delete(room.chatId);
        return nextRoomIds;
      });
    },
  });

  useEffect(() => {
    if (!meQuery.isPending && !meQuery.isError && !meQuery.data) {
      router.replace("/");
    }
  }, [meQuery.data, meQuery.isError, meQuery.isPending, router]);

  const isGlobalListMode = normalizedQuery.length > 0 || activeFilter !== "UFO";
  const allRoomsLoading =
    allChatRoomsQuery.isPending ||
    allChatRoomsQuery.isFetchingNextPage ||
    allChatRoomsQuery.hasNextPage;

  const filteredMyRooms = useMemo(() => {
    const sourceRooms = isGlobalListMode
      ? allChatRoomsQuery.rooms
      : myChatRoomsQuery.data?.rooms ?? [];
    const searchedRooms = sourceRooms.filter((room) =>
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
  }, [activeFilter, allChatRoomsQuery.rooms, isGlobalListMode, myChatRoomsQuery.data, normalizedQuery]);

  const pageSize = Math.max(
    allChatRoomsQuery.data?.pages[0]?.rooms.length ??
      myChatRoomsQuery.data?.rooms.length ??
      1,
    1,
  );
  const filteredPageCount = Math.max(1, Math.ceil(filteredMyRooms.length / pageSize));
  const resolvedCurrentPage = isGlobalListMode
    ? Math.min(currentPage, filteredPageCount)
    : currentPage;
  const visibleRooms = isGlobalListMode
    ? filteredMyRooms.slice(
        (resolvedCurrentPage - 1) * pageSize,
        resolvedCurrentPage * pageSize,
      )
    : filteredMyRooms;

  const nickname = meQuery.data?.nickname ?? "회원";
  const isChatRoomsLoading =
    meQuery.isPending ||
    (Boolean(meQuery.data) &&
      (myChatRoomsQuery.isPending || (isGlobalListMode && allRoomsLoading)));
  const isChatRoomsError =
    Boolean(meQuery.data) &&
    (myChatRoomsQuery.isError || (isGlobalListMode && allChatRoomsQuery.isError));
  const chatRoomsPage = isGlobalListMode
    ? resolvedCurrentPage
    : myChatRoomsQuery.data?.page ?? currentPage;
  const nextPage = isGlobalListMode
    ? Math.max(filteredPageCount - resolvedCurrentPage, 0)
    : myChatRoomsQuery.data?.nextPage ?? 0;
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
    if (!meQuery.data) {
      router.replace("/");
      return;
    }

    updateChatStatusMutation.mutate({
      room,
      favorite: !room.favorite,
    });
  };

  const handleHiddenChange = (room: ChatRoom) => {
    if (!meQuery.data) {
      router.replace("/");
      return;
    }

    setFoConfirmRoom(room);
  };

  const handleConfirmFoChange = () => {
    if (!foConfirmRoom) {
      return;
    }

    if (!meQuery.data) {
      router.replace("/");
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

  if (!meQuery.isPending && !meQuery.data) {
    return (
      <MobileShell>
        <StateBlock type="loading" title="홈 화면으로 이동하는 중입니다." variant="plain" />
      </MobileShell>
    );
  }

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
    <>
      <MobileShell>
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
            <span className="inline-block h-3 w-3 rounded-full bg-ufo-brand" aria-hidden="true" />
            {nickname}님
          </h2>
        </section>

        {isChatRoomsLoading ? (
          <StateBlock
            type="loading"
            title="채팅방 목록을 불러오는 중입니다."
            variant="plain"
          />
        ) : null}
        {isChatRoomsError ? (
          <StateBlock
            type="error"
            title="채팅방 목록을 불러오지 못했어요."
            actionLabel="다시 시도"
            onAction={() => {
              void myChatRoomsQuery.refetch();

              if (isGlobalListMode) {
                void allChatRoomsQuery.refetch();
              }
            }}
            className="px-4 py-8"
          />
        ) : null}

        {!isChatRoomsLoading && !isChatRoomsError ? (
          <>
            <ChatRoomList
              title="나의 채팅방"
              rooms={visibleRooms}
              filters={chatRoomFilters}
              activeFilter={activeFilter}
              onFilterChange={handleFilterChange}
              showSettingsButton
              isSettingsMode={isSettingsMode}
              updatingRoomIds={updatingRoomIds}
              onSettingsClick={handleSettingsClick}
              onFavoriteChange={handleFavoriteChange}
              onHiddenChange={handleHiddenChange}
              emptyText={
                normalizedQuery.length === 0 && activeFilter === "UFO"
                  ? "참여 중인 채팅방이 없습니다."
                  : "검색 결과가 없습니다."
              }
            />
            <Pagination
              currentPage={chatRoomsPage}
              nextPage={nextPage}
              onPageChange={setCurrentPage}
            />
          </>
        ) : null}
      </MobileShell>
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
    </>
  );
}
