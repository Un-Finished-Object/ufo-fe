import { type RefCallback } from "react";
import ChatMessageSendingIndicator from "@/features/chat/components/ChatMessageSendingIndicator";
import type { ChatMessage } from "@/features/chat/types";

type ChatMessageListProps = {
  messages: ChatMessage[];
  currentUserId: string | null;
  isLoading: boolean;
  errorMessage: string | null;
  lastConfirmedMessageId?: string | null;
  onLastConfirmedMessageRefChange?: RefCallback<HTMLElement>;
  onDeleteFailedMessage?: (message: ChatMessage) => void;
  onResendFailedMessage?: (message: ChatMessage) => void;
};

function formatMessageTime(createdAt: string | null) {
  if (!createdAt) {
    return "??:??";
  }

  const createdDate = new Date(createdAt);

  if (Number.isNaN(createdDate.getTime())) {
    return "??:??";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(createdDate);
}

export default function ChatMessageList({
  messages,
  currentUserId,
  isLoading,
  errorMessage,
  lastConfirmedMessageId = null,
  onLastConfirmedMessageRefChange,
  onDeleteFailedMessage,
  onResendFailedMessage,
}: ChatMessageListProps) {
  if (isLoading) {
    return <p className="px-4 py-6 text-sm text-ufo-text-dim">메시지를 불러오는 중입니다.</p>;
  }

  if (errorMessage) {
    return <p className="px-4 py-6 text-sm text-red-500">{errorMessage}</p>;
  }

  if (messages.length === 0) {
    return <p className="px-4 py-6 text-sm text-ufo-text-dim">아직 메시지가 없습니다.</p>;
  }

  return (
    <>
      {messages.map((message) => {
        const isMine = currentUserId !== null && message.senderId === currentUserId;
        const shouldTreatAsMine = isMine || message.status === "pending" || message.status === "failed";
        const isPending = message.status === "pending";
        const isFailed = message.status === "failed";
        const isLastConfirmedMessage =
          message.status === "confirmed" &&
          message.messageId !== null &&
          message.messageId === lastConfirmedMessageId;
        const senderName = message.senderName?.trim() || "뜨친";
        const messageMetaText = isPending || isFailed ? null : formatMessageTime(message.createdAt);

        return (
          <div
            key={message.clientMessageId ?? message.messageId ?? message.createdAt}
            className={shouldTreatAsMine ? "flex flex-col items-end gap-1" : "flex flex-col gap-1"}
            ref={isLastConfirmedMessage ? onLastConfirmedMessageRefChange : undefined}
          >
            <article className={`flex gap-2 ${shouldTreatAsMine ? "justify-end" : "justify-start"}`}>
              {!shouldTreatAsMine ? (
                <div className="max-w-[78%]">
                  <p className="mb-1 text-sm font-semibold text-ufo-text-subtle">{senderName}</p>
                  <div className="rounded-xl bg-ufo-bg px-4 py-3 text-sm text-ufo-text-secondary">
                    <p className="leading-6">{message.text}</p>
                  </div>
                </div>
              ) : null}

              {messageMetaText ? (
                <p className="self-end pb-1 text-[11px] text-ufo-text-dim">{messageMetaText}</p>
              ) : null}

              {shouldTreatAsMine ? (
                <div className="flex max-w-[78%] items-end gap-2">
                  {isPending ? <ChatMessageSendingIndicator /> : null}
                  <div className="max-w-full rounded-xl bg-ufo-brand-pale px-4 py-3 text-sm text-white">
                    <p className="leading-6">{message.text}</p>
                  </div>
                </div>
              ) : null}
            </article>

            {isFailed ? (
              <div className="flex items-center gap-3 pr-1 text-xs">
                <span className="text-red-500">전송 실패</span>
                <button
                  type="button"
                  onClick={() => onResendFailedMessage?.(message)}
                  className="font-semibold text-ufo-brand"
                >
                  재전송
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteFailedMessage?.(message)}
                  className="font-semibold text-ufo-text-dim"
                >
                  삭제
                </button>
              </div>
            ) : null}
          </div>
        );
      })}
    </>
  );
}
