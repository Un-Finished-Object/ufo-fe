"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import YesOrNo from "@/components/dialogs/YesOrNo";
import ChatInput from "@/features/chat/components/ChatInput";
import ChatMessageList from "@/features/chat/components/ChatMessageList";
import ChatRoomTopBar from "@/features/chat/components/ChatRoomTopBar";
import { useMeQuery } from "@/features/auth/hooks/useMeQuery";
import { useChatReadReceipt } from "@/features/chat/hooks/useChatReadReceipt";
import { useSendChatMessage } from "@/features/chat/hooks/useSendChatMessage";
import type { ChatMessage, ChatRoom } from "@/features/chat/types";
import { useChatMessagesQuery } from "@/features/chat/hooks/useChatMessagesQuery";
import {
  chatStatusQueryKey,
  mapChatRoomToStatus,
  type ChatStatus,
  useChatStatusQuery,
} from "@/features/chat/hooks/useChatStatusQuery";
import { myChatRoomsQueryKey, myChatRoomsQueryOptions } from "@/features/chat/queries/chatQueries";
import { CHAT_MESSAGES_FORBIDDEN_MESSAGE } from "@/features/chat/services/fetchChatMessages";
import { patchChatStatus } from "@/features/chat/services/patchChatStatus";
import { useChatRealtimeStore } from "@/features/chat/stores/useChatRealtimeStore";

type ChatConversationScreenProps = {
  patternId: string;
};

type ReplyTarget = {
  messageId: string;
  senderName: string;
  text: string;
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
  const [replyTarget, setReplyTarget] = useState<ReplyTarget | null>(null);
  const [isFoConfirmOpen, setIsFoConfirmOpen] = useState(false);
  const messagesQuery = useChatMessagesQuery(roomId);
  const messages = messagesQuery.data;
  const {
    error: messagesError,
    fetchNextPage,
    hasNextPage,
    isError: isMessagesError,
    isFetchingNextPage,
    isPending: isMessagesPending,
  } = messagesQuery;
  const currentUserId = meQuery.data?.userId ?? meQuery.data?.email ?? null;
  const [topSentinelElement, setTopSentinelElement] = useState<HTMLDivElement | null>(null);
  const [messageListElement, setMessageListElement] = useState<HTMLElement | null>(null);
  const [scrollContainerElement, setScrollContainerElement] = useState<HTMLElement | null>(null);
  const scrollContainerElementRef = useRef<HTMLElement | null>(null);
  const didScrollToInitialBottomRef = useRef(false);
  const previousScrollHeightRef = useRef<number | null>(null);
  const setCurrentRoomId = useChatRealtimeStore((state) => state.setCurrentRoomId);
  const clearCurrentRoomId = useChatRealtimeStore((state) => state.clearCurrentRoomId);
  const sendChatMessage = useSendChatMessage({
    roomId,
    senderId: currentUserId,
    senderName: meQuery.data?.nickname,
  });

  useEffect(() => {
    didScrollToInitialBottomRef.current = false;
    previousScrollHeightRef.current = null;
  }, [roomId]);

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

    sendChatMessage.sendMessage(
      nextMessageText,
      replyTarget
        ? {
            replyMessageId: replyTarget.messageId,
            replySenderName: replyTarget.senderName,
          }
        : undefined,
    );
    setMessageText("");
    setReplyTarget(null);
  };

  const handleReplyMessageSelect = (message: ChatMessage) => {
    if (message.messageId === null) {
      return;
    }

    setReplyTarget({
      messageId: message.messageId,
      senderName: message.senderName?.trim() || "뜨친",
      text: message.text,
    });
  };

  const handleReplyCancel = () => {
    setReplyTarget(null);
  };

  const handleScrollContainerRefChange = useCallback((element: HTMLElement | null) => {
    scrollContainerElementRef.current = element;
    setScrollContainerElement(element);
  }, []);

  const loadOlderMessages = useCallback(() => {
    const scrollContainer = scrollContainerElementRef.current;

    if (!scrollContainer || !hasNextPage || isFetchingNextPage) {
      return;
    }

    previousScrollHeightRef.current = scrollContainer.scrollHeight;
    void fetchNextPage();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  useEffect(() => {
    const scrollContainer = scrollContainerElementRef.current;

    if (
      !scrollContainer ||
      didScrollToInitialBottomRef.current ||
      isMessagesPending ||
      messages.length === 0
    ) {
      return;
    }

    let secondAnimationFrameId = 0;
    const firstAnimationFrameId = window.requestAnimationFrame(() => {
      secondAnimationFrameId = window.requestAnimationFrame(() => {
        const currentScrollContainer = scrollContainerElementRef.current;

        if (!currentScrollContainer) {
          return;
        }

        currentScrollContainer.scrollTop = currentScrollContainer.scrollHeight;
        didScrollToInitialBottomRef.current = true;
      });
    });

    return () => {
      window.cancelAnimationFrame(firstAnimationFrameId);

      if (secondAnimationFrameId !== 0) {
        window.cancelAnimationFrame(secondAnimationFrameId);
      }
    };
  }, [isMessagesPending, messages.length, scrollContainerElement]);

  useEffect(() => {
    if (!topSentinelElement || !scrollContainerElement || !hasNextPage) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting || !didScrollToInitialBottomRef.current) {
          return;
        }

        loadOlderMessages();
      },
      {
        root: scrollContainerElement,
        threshold: 1,
      },
    );

    observer.observe(topSentinelElement);

    return () => {
      observer.disconnect();
    };
  }, [hasNextPage, loadOlderMessages, scrollContainerElement, topSentinelElement]);

  useEffect(() => {
    const scrollContainer = scrollContainerElementRef.current;

    if (
      !scrollContainer ||
      isFetchingNextPage ||
      previousScrollHeightRef.current === null
    ) {
      return;
    }

    const previousScrollHeight = previousScrollHeightRef.current;
    previousScrollHeightRef.current = null;
    scrollContainer.scrollTop += scrollContainer.scrollHeight - previousScrollHeight;
  }, [isFetchingNextPage, messages.length, scrollContainerElement]);

  const errorMessage =
    isMessagesError && messagesError.message === CHAT_MESSAGES_FORBIDDEN_MESSAGE
      ? CHAT_MESSAGES_FORBIDDEN_MESSAGE
      : isMessagesError
        ? "메시지를 불러오지 못했습니다."
        : null;
  const lastConfirmedMessageId = useMemo(() => {
    const confirmedMessages = messages.filter(
      (message) => message.status === "confirmed" && message.messageId !== null,
    );

    return confirmedMessages.at(-1)?.messageId ?? null;
  }, [messages]);

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
      <main className="mx-auto flex h-screen min-h-screen w-full max-w-[430px] flex-col bg-ufo-surface text-ufo-text">
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
          ref={handleScrollContainerRefChange}
          className="min-h-0 flex-1 overflow-y-auto px-4 py-6"
          aria-label="채팅 메시지 목록"
        >
          <div ref={setTopSentinelElement} aria-hidden="true" className="h-px" />
          <div className="space-y-5">
            <ChatMessageList
              messages={messages}
              currentUserId={currentUserId}
              isLoading={isMessagesPending}
              errorMessage={errorMessage}
              lastConfirmedMessageId={lastConfirmedMessageId}
              onLastConfirmedMessageRefChange={setMessageListElement}
              onDeleteFailedMessage={sendChatMessage.removeFailedMessage}
              onReplyMessageSelect={handleReplyMessageSelect}
              onResendFailedMessage={sendChatMessage.resendFailedMessage}
            />
          </div>
        </section>

        <footer className="sticky bottom-0 border-t border-ufo-border-light bg-white p-4">
          <ChatInput
            value={messageText}
            isSending={false}
            isSubmitDisabled={false}
            replyPreview={replyTarget ? { senderName: replyTarget.senderName, text: replyTarget.text } : null}
            onChange={setMessageText}
            onCancelReply={handleReplyCancel}
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
