"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ToastMessage from "@/components/common/ToastMessage";
import StateBlock from "@/components/common/StateBlock";
import YesOrNo from "@/components/dialogs/YesOrNo";
import MobileShell from "@/components/layout/MobileShell";
import ChatInput from "@/features/chat/components/ChatInput";
import ChatMessageList from "@/features/chat/components/ChatMessageList";
import ChatRoomTopBar from "@/features/chat/components/ChatRoomTopBar";
import { useMeQuery } from "@/features/auth/hooks/useMeQuery";
import { useChatReadReceipt } from "@/features/chat/hooks/useChatReadReceipt";
import { useAllMyChatRoomsQuery } from "@/features/chat/hooks/useAllMyChatRoomsQuery";
import { useSendChatMessage } from "@/features/chat/hooks/useSendChatMessage";
import type { ChatMessage, ChatRoom } from "@/features/chat/types";
import { useChatMessagesQuery } from "@/features/chat/hooks/useChatMessagesQuery";
import {
  chatStatusQueryKey,
  mapChatRoomToStatus,
  type ChatStatus,
  useChatStatusQuery,
} from "@/features/chat/hooks/useChatStatusQuery";
import { updateChatRoomCaches } from "@/features/chat/lib/chatRoomCache";
import { patchChatStatus } from "@/features/chat/services/patchChatStatus";
import { useChatRealtimeStore } from "@/features/chat/stores/useChatRealtimeStore";
import { useAuthRequiredToast } from "@/hooks/useAuthRequiredToast";
import { isApiError } from "@/lib/api/ApiError";

type ChatConversationScreenProps = {
  chatId: string;
};

type ReplyTarget = {
  messageId: string;
  senderName: string;
  text: string;
};

export default function ChatConversationScreen({ chatId }: ChatConversationScreenProps) {
  const router = useRouter();
  const roomId = chatId;
  const { showToast, toastMessage } = useAuthRequiredToast();
  const meQuery = useMeQuery();
  const allChatRoomsQuery = useAllMyChatRoomsQuery({ enabled: Boolean(meQuery.data) });
  const queryClient = useQueryClient();
  const chatRoom = allChatRoomsQuery.rooms.find((room) => room.chatId === roomId);
  const roomMeta = chatRoom
      ? {
        title: chatRoom.name,
        nickname: chatRoom.nickname,
      }
    : null;
  const chatStatusQuery = useChatStatusQuery(roomId);
  const [messageText, setMessageText] = useState("");
  const [replyTarget, setReplyTarget] = useState<ReplyTarget | null>(null);
  const [isFoConfirmOpen, setIsFoConfirmOpen] = useState(false);
  const messagesQuery = useChatMessagesQuery(meQuery.data && chatRoom ? roomId : null);
  const messages = messagesQuery.data;
  const {
    error: messagesError,
    fetchNextPage,
    hasNextPage,
    isError: isMessagesError,
    isFetchNextPageError,
    isFetchingNextPage,
    isPending: isMessagesPending,
  } = messagesQuery;
  const currentUserName = chatRoom?.nickname ?? null;
  const [topSentinelElement, setTopSentinelElement] = useState<HTMLDivElement | null>(null);
  const [readMarkerElement, setReadMarkerElement] = useState<HTMLDivElement | null>(null);
  const [scrollContainerElement, setScrollContainerElement] = useState<HTMLElement | null>(null);
  const scrollContainerElementRef = useRef<HTMLElement | null>(null);
  const didScrollToInitialBottomRef = useRef(false);
  const previousScrollHeightRef = useRef<number | null>(null);
  const previousAutoScrollStateRef = useRef<{ messageCount: number; messageKey: string | null }>({
    messageCount: 0,
    messageKey: null,
  });
  const isNearBottomRef = useRef(true);
  const [isFarFromBottom, setIsFarFromBottom] = useState(false);
  const [hasUnseenMessage, setHasUnseenMessage] = useState(false);
  const setCurrentRoomId = useChatRealtimeStore((state) => state.setCurrentRoomId);
  const clearCurrentRoomId = useChatRealtimeStore((state) => state.clearCurrentRoomId);
  const connectionStatus = useChatRealtimeStore((state) => state.connectionStatus);
  const sendChatMessage = useSendChatMessage({
    roomId,
    senderName: currentUserName ?? undefined,
  });

  useEffect(() => {
    if (!meQuery.isPending && !meQuery.isError && !meQuery.data) {
      router.replace("/");
    }
  }, [meQuery.data, meQuery.isError, meQuery.isPending, router]);

  useEffect(() => {
    if (
      meQuery.data &&
      !chatRoom &&
      !allChatRoomsQuery.isError &&
      !allChatRoomsQuery.isPending &&
      !allChatRoomsQuery.isFetchingNextPage &&
      !allChatRoomsQuery.hasNextPage
    ) {
      router.replace("/chats");
    }
  }, [
    allChatRoomsQuery.hasNextPage,
    allChatRoomsQuery.isFetchingNextPage,
    allChatRoomsQuery.isError,
    allChatRoomsQuery.isPending,
    chatRoom,
    meQuery.data,
    router,
  ]);

  useEffect(() => {
    didScrollToInitialBottomRef.current = false;
    previousScrollHeightRef.current = null;
    previousAutoScrollStateRef.current = {
      messageCount: 0,
      messageKey: null,
    };
    isNearBottomRef.current = true;

    const animationFrameId = window.requestAnimationFrame(() => {
      setIsFarFromBottom(false);
      setHasUnseenMessage(false);
    });

    return () => {
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [roomId]);

  useEffect(() => {
    if (!chatRoom) {
      return;
    }

    setCurrentRoomId(roomId);

    return () => {
      clearCurrentRoomId(roomId);
    };
  }, [chatRoom, clearCurrentRoomId, roomId, setCurrentRoomId]);

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
      patchChatStatus({ chatId: roomId, favorite, hidden }),
    onMutate: ({ favorite, hidden }) => {
      const previousStatus = chatStatus;
      const previousRoom = chatRoom;
      const optimisticFavorite = favorite ?? chatStatus?.favorite ?? false;
      const optimisticHidden = hidden ?? chatStatus?.isHidden ?? false;

      queryClient.setQueryData<ChatStatus | null>(chatStatusQueryKey(roomId), {
        chatId: Number(roomId),
        favorite: optimisticFavorite,
        isHidden: optimisticHidden,
      });
      updateChatRoomCaches(queryClient, roomId, (room) => ({
        ...room,
        favorite: optimisticFavorite,
        isHidden: optimisticHidden,
      }));

      return { previousRoom, previousStatus };
    },
    onSuccess: (nextChatStatus) => {
      queryClient.setQueryData<ChatStatus | null>(chatStatusQueryKey(roomId), nextChatStatus);
      updateChatRoomCaches(queryClient, roomId, (room) => ({
        ...room,
        favorite: nextChatStatus.favorite,
        isHidden: nextChatStatus.isHidden,
      }));
    },
    onError: (error, _variables, context) => {
      queryClient.setQueryData(chatStatusQueryKey(roomId), context?.previousStatus ?? null);

      if (context?.previousRoom) {
        updateChatRoomCaches(queryClient, roomId, (currentRoom) => ({
          ...currentRoom,
          favorite: (context.previousRoom as ChatRoom).favorite,
          isHidden: (context.previousRoom as ChatRoom).isHidden,
        }));
      }

      if (isApiError(error, 401)) {
        router.replace("/");
        return;
      }

      showToast("채팅방 상태를 변경하지 못했습니다. 다시 시도해 주세요.");
    },
  });

  const handleFavoriteClick = () => {
    if (!meQuery.data) {
      router.replace("/");
      return;
    }

    const nextFavorite = !(chatStatus?.favorite ?? false);
    updateChatStatusMutation.mutate({ favorite: nextFavorite });
  };

  const handleFoClick = () => {
    if (!meQuery.data) {
      router.replace("/");
      return;
    }

    setIsFoConfirmOpen(true);
  };

  const handleConfirmFoChange = () => {
    if (!meQuery.data) {
      router.replace("/");
      setIsFoConfirmOpen(false);
      return;
    }

    const nextHidden = !(chatStatus?.isHidden ?? false);
    updateChatStatusMutation.mutate({ hidden: nextHidden });
    setIsFoConfirmOpen(false);
  };

  const handleCloseFoConfirm = () => {
    setIsFoConfirmOpen(false);
  };

  const handleSendMessage = () => {
    if (!meQuery.data) {
      router.replace("/");
      return;
    }

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

  const updateScrollPositionState = useCallback(() => {
    const scrollContainer = scrollContainerElementRef.current;

    if (!scrollContainer) {
      return;
    }

    const distanceFromBottom =
      scrollContainer.scrollHeight - scrollContainer.scrollTop - scrollContainer.clientHeight;
    const isNearBottom = distanceFromBottom <= 80;

    isNearBottomRef.current = isNearBottom;
    setIsFarFromBottom(distanceFromBottom > 240);

    if (isNearBottom) {
      setHasUnseenMessage(false);
    }
  }, []);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    const scrollContainer = scrollContainerElementRef.current;

    if (!scrollContainer) {
      return;
    }

    scrollContainer.scrollTo({
      top: scrollContainer.scrollHeight,
      behavior,
    });
    isNearBottomRef.current = true;
    setIsFarFromBottom(false);
    setHasUnseenMessage(false);
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
        updateScrollPositionState();
      });
    });

    return () => {
      window.cancelAnimationFrame(firstAnimationFrameId);

      if (secondAnimationFrameId !== 0) {
        window.cancelAnimationFrame(secondAnimationFrameId);
      }
    };
  }, [isMessagesPending, messages.length, scrollContainerElement, updateScrollPositionState]);

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

  const isMessagesForbidden = isMessagesError && isApiError(messagesError, 403);
  const isInitialMessagesError = isMessagesError && messages.length === 0;
  const errorMessage =
    isInitialMessagesError && !isMessagesForbidden
        ? "메시지를 불러오지 못했습니다."
        : null;

  useEffect(() => {
    if (isMessagesForbidden) {
      router.replace("/chats");
    }
  }, [isMessagesForbidden, router]);
  const lastConfirmedMessageId = useMemo(() => {
    const confirmedMessages = messages.filter(
      (message) => message.status === "confirmed" && message.messageId !== null,
    );

    return confirmedMessages.at(-1)?.messageId ?? null;
  }, [messages]);
  const lastMessageKey = useMemo(() => {
    const lastMessage = messages.at(-1);

    return lastMessage?.clientMessageId ?? lastMessage?.messageId ?? lastMessage?.createdAt ?? null;
  }, [messages]);

  useEffect(() => {
    const previousAutoScrollState = previousAutoScrollStateRef.current;
    const lastMessage = messages.at(-1);

    if (!lastMessageKey || !lastMessage || isMessagesPending || isFetchingNextPage) {
      return;
    }

    previousAutoScrollStateRef.current = {
      messageCount: messages.length,
      messageKey: lastMessageKey,
    };

    if (!previousAutoScrollState.messageKey || previousAutoScrollState.messageKey === lastMessageKey) {
      return;
    }

    const isMyMessage =
      lastMessage.status === "pending" ||
      lastMessage.status === "failed" ||
      (currentUserName !== null && lastMessage.senderName?.trim() === currentUserName.trim());

    if (!isNearBottomRef.current && !isMyMessage) {
      const animationFrameId = window.requestAnimationFrame(() => {
        setHasUnseenMessage(true);
      });

      return () => {
        window.cancelAnimationFrame(animationFrameId);
      };
    }

    const animationFrameId = window.requestAnimationFrame(() => {
      scrollToBottom("smooth");
    });

    return () => {
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [
    currentUserName,
    isFetchingNextPage,
    isMessagesPending,
    lastMessageKey,
    messages,
    scrollToBottom,
  ]);

  useChatReadReceipt({
    ownerUserId: meQuery.data?.userId ?? null,
    roomId,
    lastConfirmedMessageId,
    targetElement: readMarkerElement,
    scrollContainer: scrollContainerElement,
  });

  const isFoActive = chatStatus?.isHidden ?? false;
  const chatInputPlaceholderName = currentUserName?.trim() || "회원";
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

  const isChatScreenLoading =
    meQuery.isPending ||
    (Boolean(meQuery.data) &&
      !chatRoom &&
      (allChatRoomsQuery.isPending ||
        allChatRoomsQuery.isFetchingNextPage ||
        allChatRoomsQuery.hasNextPage));

  if (meQuery.data && !chatRoom && allChatRoomsQuery.isError) {
    return (
      <MobileShell fullHeight dynamicViewport>
        <StateBlock
          type="error"
          title="채팅방 목록을 불러오지 못했어요."
          actionLabel="다시 시도"
          onAction={() => void allChatRoomsQuery.refetch()}
          variant="card"
        />
      </MobileShell>
    );
  }

  if (
    isChatScreenLoading ||
    !chatRoom ||
    (!meQuery.isPending && !meQuery.data) ||
    isMessagesForbidden
  ) {
    return (
      <MobileShell fullHeight dynamicViewport>
        <StateBlock
          type="loading"
          title={isMessagesForbidden ? "채팅방 목록으로 이동하는 중입니다." : "채팅방을 불러오는 중입니다."}
          variant="plain"
        />
      </MobileShell>
    );
  }

  return (
    <>
      <MobileShell fullHeight dynamicViewport>
        <ChatRoomTopBar
          title={roomMeta?.title ?? "채팅방"}
          subtitle={roomMeta?.nickname ?? null}
          right={[
            {
              type: "favorite",
              ariaLabel: "즐겨찾기",
              active: chatStatus?.favorite ?? false,
              onClick: handleFavoriteClick,
              disabled: updateChatStatusMutation.isPending,
            },
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
          onScroll={updateScrollPositionState}
          className="relative min-h-0 flex-1 overflow-y-auto px-4 py-6"
          aria-label="채팅 메시지 목록"
        >
          <div ref={setTopSentinelElement} aria-hidden="true" className="h-px" />
          {isFetchingNextPage ? (
            <p className="absolute top-2 left-1/2 z-10 -translate-x-1/2 rounded-full bg-white px-4 py-2 text-center text-xs text-ufo-text-dim shadow-sm" role="status">
              이전 메시지를 불러오는 중입니다.
            </p>
          ) : null}
          {isFetchNextPageError ? (
            <div className="absolute top-2 left-1/2 z-10 w-max max-w-[calc(100%-2rem)] -translate-x-1/2 rounded-xl bg-white px-4 py-2 text-center text-xs text-ufo-text-dim shadow-sm">
              <p>이전 메시지를 불러오지 못했습니다.</p>
              <button
                type="button"
                onClick={loadOlderMessages}
                className="mt-2 min-h-11 rounded-full px-4 font-semibold text-ufo-brand"
              >
                다시 시도
              </button>
            </div>
          ) : null}
          <div className="space-y-5">
            <ChatMessageList
              messages={messages}
              currentUserName={currentUserName}
              isLoading={isMessagesPending}
              errorMessage={errorMessage}
              onRetry={isInitialMessagesError ? () => void messagesQuery.refetch() : undefined}
              onDeleteFailedMessage={sendChatMessage.removeFailedMessage}
              onReplyMessageSelect={handleReplyMessageSelect}
              onResendFailedMessage={sendChatMessage.resendFailedMessage}
            />
            <div ref={setReadMarkerElement} className="h-px" aria-hidden="true" />
          </div>
        </section>

        <footer className="sticky bottom-0 border-t border-ufo-border-light bg-white px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {hasUnseenMessage || isFarFromBottom ? (
            <button
              type="button"
              onClick={() => scrollToBottom()}
              className="absolute -top-12 left-1/2 min-h-10 -translate-x-1/2 rounded-full border border-ufo-border-light bg-white px-4 text-xs font-semibold text-ufo-brand shadow-md"
              aria-label={hasUnseenMessage ? "새 메시지로 이동" : "대화 맨 아래로 이동"}
            >
              {hasUnseenMessage ? "새 메시지" : "아래로 이동"}
            </button>
          ) : null}
          {connectionStatus !== "connected" ? (
            <p className="mb-3 text-center text-xs text-ufo-text-subtle" role="status">
              채팅 연결 상태가 원활하지 않습니다. 연결 후 메시지를 보낼 수 있습니다.
            </p>
          ) : null}
          <ChatInput
            value={messageText}
            isSending={sendChatMessage.isPending}
            placeholder={`${chatInputPlaceholderName}(으)로 대화해보세요.`}
            isSubmitDisabled={connectionStatus !== "connected"}
            replyPreview={replyTarget ? { senderName: replyTarget.senderName, text: replyTarget.text } : null}
            onChange={setMessageText}
            onCancelReply={handleReplyCancel}
            onSendMessage={handleSendMessage}
          />
        </footer>
      </MobileShell>

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
      <ToastMessage message={toastMessage} />
    </>
  );
}
