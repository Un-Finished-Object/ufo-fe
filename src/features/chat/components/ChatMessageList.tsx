"use client";

import { type RefCallback, useEffect, useRef } from "react";
import ChatMessageSendingIndicator from "@/features/chat/components/ChatMessageSendingIndicator";
import type { ChatMessage } from "@/features/chat/types";

const LONG_PRESS_DURATION_MS = 450;
const LONG_PRESS_MOVE_TOLERANCE_PX = 12;

type ChatMessageListProps = {
  messages: ChatMessage[];
  currentUserId: string | null;
  isLoading: boolean;
  errorMessage: string | null;
  lastConfirmedMessageId?: string | null;
  onLastConfirmedMessageRefChange?: RefCallback<HTMLElement>;
  onDeleteFailedMessage?: (message: ChatMessage) => void;
  onReplyMessageSelect?: (message: ChatMessage) => void;
  onResendFailedMessage?: (message: ChatMessage) => void;
};

type ChatMessageItemProps = {
  currentUserId: string | null;
  isLastConfirmedMessage: boolean;
  message: ChatMessage;
  messageById: Map<string, ChatMessage>;
  onDeleteFailedMessage?: (message: ChatMessage) => void;
  onLastConfirmedMessageRefChange?: RefCallback<HTMLElement>;
  onReplyMessageSelect?: (message: ChatMessage) => void;
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

function ChatMessageItem({
  currentUserId,
  isLastConfirmedMessage,
  message,
  messageById,
  onDeleteFailedMessage,
  onLastConfirmedMessageRefChange,
  onReplyMessageSelect,
  onResendFailedMessage,
}: ChatMessageItemProps) {
  const longPressTimeoutRef = useRef<number | null>(null);
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);

  const isMine = currentUserId !== null && message.senderId === currentUserId;
  const shouldTreatAsMine = isMine || message.status === "pending" || message.status === "failed";
  const isPending = message.status === "pending";
  const isFailed = message.status === "failed";
  const canReply = message.status === "confirmed" && message.messageId !== null;
  const senderName = message.senderName?.trim() || "뜨친";
  const messageMetaText = isPending || isFailed ? null : formatMessageTime(message.createdAt);
  const repliedMessage =
    message.replyMessageId !== null && message.replyMessageId !== undefined
      ? messageById.get(message.replyMessageId)
      : undefined;
  const replySenderName = message.replySenderName?.trim();
  const replyPreviewText = repliedMessage?.text?.trim();
  const hasReply = Boolean(replySenderName && message.replyMessageId);

  const clearLongPress = () => {
    if (longPressTimeoutRef.current !== null) {
      window.clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }

    pointerStartRef.current = null;
  };

  useEffect(() => {
    return () => {
      if (longPressTimeoutRef.current !== null) {
        window.clearTimeout(longPressTimeoutRef.current);
      }
    };
  }, []);

  const handleReplySelect = () => {
    if (!canReply) {
      return;
    }

    onReplyMessageSelect?.(message);
  };

  const handleTouchPointerDown = (clientX: number, clientY: number) => {
    if (!canReply) {
      return;
    }

    clearLongPress();
    pointerStartRef.current = { x: clientX, y: clientY };
    longPressTimeoutRef.current = window.setTimeout(() => {
      handleReplySelect();
      clearLongPress();
    }, LONG_PRESS_DURATION_MS);
  };

  const handleTouchPointerMove = (clientX: number, clientY: number) => {
    const pointerStart = pointerStartRef.current;

    if (!pointerStart) {
      return;
    }

    const distanceX = Math.abs(clientX - pointerStart.x);
    const distanceY = Math.abs(clientY - pointerStart.y);

    if (distanceX > LONG_PRESS_MOVE_TOLERANCE_PX || distanceY > LONG_PRESS_MOVE_TOLERANCE_PX) {
      clearLongPress();
    }
  };

  const metaSlot = messageMetaText || canReply ? (
    <div
      className={`relative flex min-w-12 items-end pb-1 ${
        shouldTreatAsMine ? "justify-start" : "justify-end"
      }`}
    >
      {messageMetaText ? (
        <p className="text-[11px] text-ufo-text-dim transition-opacity duration-150 group-hover/message:opacity-0 group-focus-within/message:opacity-0">
          {messageMetaText}
        </p>
      ) : null}

      {canReply ? (
        <button
          type="button"
          onClick={handleReplySelect}
          className="absolute inset-x-0 bottom-0 rounded-md border border-ufo-border-light bg-white px-1 py-[0.2rem] text-[11px] font-semibold text-ufo-brand opacity-0 shadow-none transition-opacity duration-150 group-hover/message:opacity-100 group-focus-within/message:opacity-100"
          aria-label={`${senderName} 메시지에 답장`}
        >
          답장
        </button>
      ) : null}
    </div>
  ) : null;

  return (
    <div
      key={message.clientMessageId ?? message.messageId ?? message.createdAt}
      className={shouldTreatAsMine ? "flex flex-col items-end gap-1" : "flex flex-col gap-1"}
      ref={isLastConfirmedMessage ? onLastConfirmedMessageRefChange : undefined}
    >
      <article
        className={`group/message flex gap-2 ${shouldTreatAsMine ? "justify-end" : "justify-start"}`}
        onPointerCancel={() => {
          clearLongPress();
        }}
        onPointerDown={(event) => {
          if (event.pointerType !== "touch") {
            return;
          }

          handleTouchPointerDown(event.clientX, event.clientY);
        }}
        onPointerLeave={() => {
          clearLongPress();
        }}
        onPointerMove={(event) => {
          if (event.pointerType !== "touch") {
            return;
          }

          handleTouchPointerMove(event.clientX, event.clientY);
        }}
        onPointerUp={() => {
          clearLongPress();
        }}
      >
        {!shouldTreatAsMine ? (
          <div className="max-w-[78%]">
            <p className="mb-1 text-sm font-semibold text-ufo-text-subtle">{senderName}</p>
            <div className="rounded-xl bg-ufo-bg px-4 py-3 text-sm text-ufo-text-secondary">
              {hasReply ? (
                <div className="mb-2 rounded-lg border border-ufo-border-light bg-white/70 px-3 py-2">
                  <p className="text-xs font-semibold text-ufo-text-subtle">{replySenderName}에게 답장</p>
                  {replyPreviewText ? (
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-ufo-text-dim">
                      {replyPreviewText}
                    </p>
                  ) : null}
                </div>
              ) : null}
              <p className="leading-6">{message.text}</p>
            </div>
          </div>
        ) : null}

        {metaSlot}

        {shouldTreatAsMine ? (
          <div className="flex max-w-[78%] items-end gap-2">
            {isPending ? <ChatMessageSendingIndicator /> : null}
            <div className="max-w-full rounded-xl bg-ufo-brand-pale px-4 py-3 text-sm text-ufo-text">
              {hasReply ? (
                <div className="mb-2 rounded-lg bg-white/70 px-3 py-2 text-ufo-text-secondary">
                  <p className="text-xs font-semibold text-ufo-text-subtle">{replySenderName}에게 답장</p>
                  {replyPreviewText ? (
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-ufo-text-dim">
                      {replyPreviewText}
                    </p>
                  ) : null}
                </div>
              ) : null}
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
}

export default function ChatMessageList({
  messages,
  currentUserId,
  isLoading,
  errorMessage,
  lastConfirmedMessageId = null,
  onLastConfirmedMessageRefChange,
  onDeleteFailedMessage,
  onReplyMessageSelect,
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

  const messageById = new Map(
    messages
      .filter((message): message is ChatMessage & { messageId: string } => message.messageId !== null)
      .map((message) => [message.messageId, message] as const),
  );

  return (
    <>
      {messages.map((message) => (
        <ChatMessageItem
          key={message.clientMessageId ?? message.messageId ?? message.createdAt}
          currentUserId={currentUserId}
          isLastConfirmedMessage={
            message.status === "confirmed" &&
            message.messageId !== null &&
            message.messageId === lastConfirmedMessageId
          }
          message={message}
          messageById={messageById}
          onDeleteFailedMessage={onDeleteFailedMessage}
          onLastConfirmedMessageRefChange={onLastConfirmedMessageRefChange}
          onReplyMessageSelect={onReplyMessageSelect}
          onResendFailedMessage={onResendFailedMessage}
        />
      ))}
    </>
  );
}
