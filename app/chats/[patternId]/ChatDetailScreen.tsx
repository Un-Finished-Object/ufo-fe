"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import ChatInput from "@/components/chat/ChatInput";
import ChatMessageList from "@/components/chat/ChatMessageList";
import ChatTopBar from "@/components/chat/ChatTopBar";
import { getRoomMeta } from "@/features/chat/mock-data";
import { useMeQuery } from "@/hooks/queries/useMeQuery";
import type { ChatRoom } from "@/features/chat/types";
import { useChatRoomSubscription } from "@/src/features/chat/hooks/useChatRoomSubscription";
import { useChatMessagesQuery } from "@/src/hooks/queries/useChatMessagesQuery";
import {
  chatStatusQueryKey,
  mapChatRoomToStatus,
  type ChatStatus,
  useChatStatusQuery,
} from "@/src/hooks/queries/useChatStatusQuery";
import { myChatRoomsQueryKey, useMyChatRoomsQuery } from "@/src/hooks/queries/useMyChatRoomsQuery";
import { patchChatStatus } from "@/src/services/chat/patchChatStatus";

type ChatDetailScreenProps = {
  patternId: string;
};

export default function ChatDetailScreen({ patternId }: ChatDetailScreenProps) {
  const roomId = patternId;
  const roomMetaFallback = getRoomMeta(roomId);
  const meQuery = useMeQuery();
  const myChatRoomsQuery = useMyChatRoomsQuery();
  const chatRoom = myChatRoomsQuery.data?.find((room) => room.patternId === roomId);
  const roomMeta = chatRoom
    ? {
        title: chatRoom.name,
        participants: "",
      }
    : roomMetaFallback;
  const queryClient = useQueryClient();
  const chatStatusQuery = useChatStatusQuery(roomId);
  const [messageText, setMessageText] = useState("");
  const messagesQuery = useChatMessagesQuery(roomId);
  const currentUserId = meQuery.data?.userId ?? meQuery.data?.email ?? null;

  useChatRoomSubscription(roomId);

  useEffect(() => {
    const nextChatStatus = mapChatRoomToStatus(roomId, chatRoom);

    if (!nextChatStatus) {
      return;
    }

    queryClient.setQueryData<ChatStatus | null>(chatStatusQueryKey(roomId), (previousStatus) => {
      if (
        previousStatus?.chatId === nextChatStatus.chatId &&
        previousStatus.favorite === nextChatStatus.favorite &&
        previousStatus.isHidden === nextChatStatus.isHidden
      ) {
        return previousStatus;
      }

      return nextChatStatus;
    });
  }, [chatRoom, queryClient, roomId]);

  const chatStatus = chatStatusQuery.data ?? mapChatRoomToStatus(roomId, chatRoom);
  const updateChatStatusMutation = useMutation({
    mutationFn: ({ favorites, hidden }: { favorites?: boolean; hidden?: boolean }) =>
      patchChatStatus({ patternId: roomId, favorites, hidden }),
    onSuccess: (nextChatStatus) => {
      queryClient.setQueryData<ChatStatus | null>(chatStatusQueryKey(roomId), nextChatStatus);
      queryClient.setQueryData<ChatRoom[]>(myChatRoomsQueryKey, (previousRooms) =>
        previousRooms?.map((room) =>
          room.patternId === roomId
            ? {
                ...room,
                favorite: nextChatStatus.favorite,
                isHidden: nextChatStatus.isHidden,
              }
            : room,
        ),
      );
    },
  });

  const handleFavoriteClick = () => {
    const nextFavorite = !(chatStatus?.favorite ?? false);
    updateChatStatusMutation.mutate({ favorites: nextFavorite });
  };

  const handleFoClick = () => {
    const nextHidden = !(chatStatus?.isHidden ?? false);
    updateChatStatusMutation.mutate({ hidden: nextHidden });
  };

  const handleSendMessage = () => undefined;

  const errorMessage = roomMeta
    ? messagesQuery.isError
      ? "메시지를 불러오지 못했습니다."
      : null
    : "채팅방 정보를 찾을 수 없습니다.";

  return (
    <div className="min-h-screen bg-ufo-bg">
      <main className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col bg-ufo-surface text-ufo-text">
        <ChatTopBar
          leftHref="/chats"
          title={roomMeta?.title ?? "알 수 없는 채팅방"}
          subtitle={roomMeta?.participants ?? null}
          right={[
            {
              type: "favorite",
              ariaLabel: "즐겨찾기",
              active: chatStatus?.favorite ?? false,
              onClick: handleFavoriteClick,
              disabled: updateChatStatusMutation.isPending,
            },
            { type: "search", ariaLabel: "검색" },
            {
              type: "fo",
              ariaLabel: "FO",
              active: chatStatus?.isHidden ?? false,
              onClick: handleFoClick,
              disabled: updateChatStatusMutation.isPending,
            },
          ]}
        />

        <section className="flex-1 space-y-5 overflow-y-auto px-4 py-6" aria-label="채팅 메시지 목록">
          <ChatMessageList
            messages={messagesQuery.data ?? []}
            currentUserId={currentUserId}
            isLoading={messagesQuery.isPending}
            errorMessage={errorMessage}
          />
        </section>

        <footer className="sticky bottom-0 border-t border-[#f0b2b2] bg-white p-4">
          <ChatInput
            value={messageText}
            isSending={false}
            isSubmitDisabled
            onChange={setMessageText}
            onSendMessage={handleSendMessage}
          />
        </footer>
      </main>
    </div>
  );
}
