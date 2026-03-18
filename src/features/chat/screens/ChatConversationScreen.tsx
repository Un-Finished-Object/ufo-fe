"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import ChatInput from "@/features/chat/components/ChatInput";
import ChatMessageList from "@/features/chat/components/ChatMessageList";
import ChatRoomTopBar from "@/features/chat/components/ChatRoomTopBar";
import { useMeQuery } from "@/features/auth/hooks/useMeQuery";
import type { ChatRoom } from "@/features/chat/types";
import { useChatRoomSubscription } from "@/features/chat/hooks/useChatRoomSubscription";
import { useChatMessagesQuery } from "@/features/chat/hooks/useChatMessagesQuery";
import {
  chatStatusQueryKey,
  mapChatRoomToStatus,
  type ChatStatus,
  useChatStatusQuery,
} from "@/features/chat/hooks/useChatStatusQuery";
import { myChatRoomsQueryKey, useMyChatRoomsQuery } from "@/features/chat/hooks/useMyChatRoomsQuery";
import { patchChatStatus } from "@/features/chat/services/patchChatStatus";

type ChatConversationScreenProps = {
  patternId: string;
};

export default function ChatConversationScreen({ patternId }: ChatConversationScreenProps) {
  const roomId = patternId;
  const meQuery = useMeQuery();
  const myChatRoomsQuery = useMyChatRoomsQuery();
  const chatRoom = myChatRoomsQuery.data?.find((room) => room.patternId === roomId);
  const roomMeta = chatRoom
    ? {
        title: chatRoom.name,
        participants: "",
      }
    : null;
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
    mutationFn: ({ favorite, hidden }: { favorite?: boolean; hidden?: boolean }) =>
      patchChatStatus({ patternId: roomId, favorite, hidden }),
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
    updateChatStatusMutation.mutate({ favorite: nextFavorite });
  };

  const handleFoClick = () => {
    const nextHidden = !(chatStatus?.isHidden ?? false);
    updateChatStatusMutation.mutate({ hidden: nextHidden });
  };

  const handleSendMessage = () => undefined;

  const errorMessage = messagesQuery.isError ? "메시지를 불러오지 못했습니다." : null;

  return (
    <div className="min-h-screen bg-ufo-bg">
      <main className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col bg-ufo-surface text-ufo-text">
        <ChatRoomTopBar
          leftHref="/chats"
          title={roomMeta?.title ?? "채팅방"}
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
