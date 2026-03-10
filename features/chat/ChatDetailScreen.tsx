"use client";

import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import ChatInput from "@/features/chat/components/ChatInput";
import ChatMessageList from "@/features/chat/components/ChatMessageList";
import { getRoomMeta } from "@/features/chat/mock-data";
import type { ChatMessage } from "@/features/chat/types";
import { chatMessagesQueryKey, useChatMessagesQuery } from "@/src/hooks/queries/useChatMessagesQuery";
import { chatStore } from "@/src/stores/chatStore";

type ChatDetailScreenProps = {
  patternId: string;
};

function BackIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className="h-6 w-6"
      fill="none"
      aria-hidden="true"
    >
      <path d="M15 5 8 12l7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export default function ChatDetailScreen({ patternId }: ChatDetailScreenProps) {
  const roomId = patternId;
  const roomMeta = getRoomMeta(roomId);
  const queryClient = useQueryClient();
  const [messageText, setMessageText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const setCurrentRoomId = chatStore((state) => state.setCurrentRoomId);
  const subscribeRoom = chatStore((state) => state.subscribeRoom);
  const unsubscribeRoom = chatStore((state) => state.unsubscribeRoom);
  const resetUnreadCount = chatStore((state) => state.resetUnreadCount);
  const messagesQuery = useChatMessagesQuery(roomId);

  useEffect(() => {
    setCurrentRoomId(roomId);
    subscribeRoom(roomId);
    resetUnreadCount(roomId);

    return () => {
      unsubscribeRoom(roomId);
      setCurrentRoomId(null);
    };
  }, [resetUnreadCount, roomId, setCurrentRoomId, subscribeRoom, unsubscribeRoom]);

  const canSend = useMemo(
    () => messageText.trim().length > 0 && !isSending && !messagesQuery.isPending,
    [isSending, messageText, messagesQuery.isPending]
  );

  const handleSubmit = () => {
    if (!canSend) {
      return;
    }

    const nextMessage: ChatMessage = {
      messageId: `local-${Date.now()}`,
      senderId: "me",
      text: messageText.trim(),
      createdAt: new Date().toISOString(),
    };

    queryClient.setQueryData<ChatMessage[]>(chatMessagesQueryKey(roomId), (previousMessages = []) => [
      ...previousMessages,
      nextMessage,
    ]);
    setMessageText("");
    setIsSending(true);

    window.setTimeout(() => {
      setIsSending(false);
    }, 120);
  };

  const errorMessage = roomMeta
    ? messagesQuery.isError
      ? "메시지를 불러오지 못했습니다."
      : null
    : "채팅방 정보를 찾을 수 없습니다.";

  return (
    <div className="min-h-screen bg-ufo-bg">
      <main className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col bg-ufo-surface text-ufo-text">
        <header className="border-b border-[#ededed] px-4 py-3">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-2">
              <Link
                href="/chats"
                className="mt-0.5 rounded-full p-1 text-[#f2a4aa]"
                aria-label="채팅방 목록으로 이동"
              >
                <BackIcon />
              </Link>

              <div>
                <h1 className="text-base font-semibold text-[#2d2d2d]">{roomMeta?.title ?? "알 수 없는 채팅방"}</h1>
                <p className="text-sm text-[#787878]">{roomMeta?.participants ?? "0명"}</p>
              </div>
            </div>

            <div className="mt-1 flex items-center gap-3 text-[#f2a4aa]" aria-label="채팅방 액션">
              <button type="button" className="text-xl font-bold" aria-label="즐겨찾기">
                ★
              </button>
              <button type="button" className="text-xl" aria-label="검색">
                ⌕
              </button>
              <button type="button" className="text-xl font-bold" aria-label="채팅방 옵션">
                FO
              </button>
            </div>
          </div>
        </header>

        <section className="flex-1 space-y-5 overflow-y-auto px-4 py-6" aria-label="채팅 메시지 목록">
          <ChatMessageList
            messages={messagesQuery.data ?? []}
            isLoading={messagesQuery.isPending}
            errorMessage={errorMessage}
          />
        </section>

        <footer className="sticky bottom-0 border-t border-[#f0b2b2] bg-white p-4">
          <ChatInput
            value={messageText}
            isSending={isSending}
            onChange={setMessageText}
            onSubmit={handleSubmit}
          />
        </footer>
      </main>
    </div>
  );
}
