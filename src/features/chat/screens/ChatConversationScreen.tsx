"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import YesOrNo from "@/components/dialogs/YesOrNo";
import ChatInput from "@/features/chat/components/ChatInput";
import ChatMessageList from "@/features/chat/components/ChatMessageList";
import ChatRoomTopBar from "@/features/chat/components/ChatRoomTopBar";
import { useMeQuery } from "@/features/auth/hooks/useMeQuery";
import { useChatReadReceipt } from "@/features/chat/hooks/useChatReadReceipt";
import { useSendChatMessage } from "@/features/chat/hooks/useSendChatMessage";
import type { ChatRoom } from "@/features/chat/types";
import { useChatMessagesQuery } from "@/features/chat/hooks/useChatMessagesQuery";
import {
  chatStatusQueryKey,
  mapChatRoomToStatus,
  type ChatStatus,
  useChatStatusQuery,
} from "@/features/chat/hooks/useChatStatusQuery";
import { myChatRoomsQueryKey, myChatRoomsQueryOptions } from "@/features/chat/queries/chatQueries";
import { patchChatStatus } from "@/features/chat/services/patchChatStatus";
import { useChatRealtimeStore } from "@/features/chat/stores/useChatRealtimeStore";

type ChatConversationScreenProps = {
  patternId: string;
};

export default function ChatConversationScreen({ patternId }: ChatConversationScreenProps) {
  const roomId = patternId;
  const meQuery = useMeQuery();
  const myChatRoomsQuery = useQuery(myChatRoomsQueryOptions());
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
  const [isFoConfirmOpen, setIsFoConfirmOpen] = useState(false);
  const messagesQuery = useChatMessagesQuery(roomId);
  const currentUserId = meQuery.data?.userId ?? meQuery.data?.email ?? null;
  const [messageListElement, setMessageListElement] = useState<HTMLElement | null>(null);
  const [scrollContainerElement, setScrollContainerElement] = useState<HTMLElement | null>(null);
  const setCurrentRoomId = useChatRealtimeStore((state) => state.setCurrentRoomId);
  const clearCurrentRoomId = useChatRealtimeStore((state) => state.clearCurrentRoomId);
  const sendChatMessage = useSendChatMessage({
    roomId,
    senderId: currentUserId,
    senderName: meQuery.data?.nickname,
  });

  useEffect(() => {
    setCurrentRoomId(roomId);

    return () => {
      clearCurrentRoomId(roomId);
    };
  }, [clearCurrentRoomId, roomId, setCurrentRoomId]);

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
    setIsFoConfirmOpen(true);
  };

  const handleConfirmFoChange = () => {
    const nextHidden = !(chatStatus?.isHidden ?? false);
    updateChatStatusMutation.mutate({ hidden: nextHidden });
    setIsFoConfirmOpen(false);
  };

  const handleCloseFoConfirm = () => {
    setIsFoConfirmOpen(false);
  };

  const handleSendMessage = () => {
    const nextMessageText = messageText.trim();

    if (!nextMessageText) {
      return;
    }

    sendChatMessage.sendMessage(nextMessageText);
    setMessageText("");
  };

  const errorMessage = messagesQuery.isError ? "메시지를 불러오지 못했습니다." : null;
  const lastConfirmedMessageId = useMemo(() => {
    const confirmedMessages = (messagesQuery.data ?? []).filter(
      (message) => message.status === "confirmed" && message.messageId !== null,
    );

    return confirmedMessages.at(-1)?.messageId ?? null;
  }, [messagesQuery.data]);

  useChatReadReceipt({
    roomId,
    lastConfirmedMessageId,
    targetElement: messageListElement,
    scrollContainer: scrollContainerElement,
  });

  const isFoActive = chatStatus?.isHidden ?? false;
  const foConfirmMainText = isFoActive
    ? "이 채팅방의 매듭을 푸시겠습니까?"
    : "이 채팅방을 매듭짓겠습니까?";
  const foConfirmSubText = isFoActive ? (
    <>{"'나의 채팅방'에서 채팅방을 확인할 수 있습니다."}</>
  ) : (
    <>
      <p>{"'나의 채팅방 > FO'에서 채팅방을 확인할 수 있습니다."}</p>
      <p className="mt-1">{"*FO 버튼을 한 번 더 누르면 다시 불러올 수 있습니다."}</p>
    </>
  );

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

        <section
          ref={setScrollContainerElement}
          className="flex-1 space-y-5 overflow-y-auto px-4 py-6"
          aria-label="채팅 메시지 목록"
        >
          <ChatMessageList
            messages={messagesQuery.data ?? []}
            currentUserId={currentUserId}
            isLoading={messagesQuery.isPending}
            errorMessage={errorMessage}
            lastConfirmedMessageId={lastConfirmedMessageId}
            onLastConfirmedMessageRefChange={setMessageListElement}
            onDeleteFailedMessage={sendChatMessage.removeFailedMessage}
            onResendFailedMessage={sendChatMessage.resendFailedMessage}
          />
        </section>

        <footer className="sticky bottom-0 border-t border-[#f0b2b2] bg-white p-4">
          <ChatInput
            value={messageText}
            isSending={false}
            isSubmitDisabled={false}
            onChange={setMessageText}
            onSendMessage={handleSendMessage}
          />
        </footer>
      </main>

      {isFoConfirmOpen ? (
        <YesOrNo
          mainText={foConfirmMainText}
          subText={foConfirmSubText}
          yesDisabled={updateChatStatusMutation.isPending}
          noDisabled={updateChatStatusMutation.isPending}
          onYes={handleConfirmFoChange}
          onNo={handleCloseFoConfirm}
        />
      ) : null}
    </div>
  );
}
