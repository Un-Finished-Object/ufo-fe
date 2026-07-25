"use client";

import { useEffect, useRef, useState } from "react";
import StateBlock from "@/components/common/StateBlock";
import ChatDateSeparator from "@/features/chat/components/ChatDateSeparator";
import ChatLastReadSeparator from "@/features/chat/components/ChatLastReadSeparator";
import ChatMessageActionsDialog from "@/features/chat/components/ChatMessageActionsDialog";
import ChatMessageSendingIndicator from "@/features/chat/components/ChatMessageSendingIndicator";
import type { ChatMessage } from "@/features/chat/types";

const LONG_PRESS_DURATION_MS = 450;
const LONG_PRESS_MOVE_TOLERANCE_PX = 12;
const SWIPE_REPLY_THRESHOLD_PX = 56;
const MAX_SWIPE_OFFSET_PX = 72;

type ChatMessageListProps = {
  messages: ChatMessage[];
  currentUserName: string | null;
  isLoading: boolean;
  errorMessage: string | null;
  lastReadMessageId?: string | null;
  onLastReadMarkerRefChange?: (element: HTMLDivElement | null) => void;
  onRetry?: () => void;
  onDeleteFailedMessage?: (message: ChatMessage) => void;
  onReplyMessageSelect?: (message: ChatMessage) => void;
  onResendFailedMessage?: (message: ChatMessage) => void;
};

type ChatMessageItemProps = {
  currentUserName: string | null;
  message: ChatMessage;
  messageById: Map<string, ChatMessage>;
  showMessageTime: boolean;
  showSenderName: boolean;
  onDeleteFailedMessage?: (message: ChatMessage) => void;
  onReplyMessageSelect?: (message: ChatMessage) => void;
  onResendFailedMessage?: (message: ChatMessage) => void;
};

type ReplyPreviewProps = {
  senderName: string;
  text: string | null;
};

function ReplyPreview({ senderName, text }: ReplyPreviewProps) {
  const previewText = text || "이전 메시지";

  return (
    <div className="mb-2 border-b border-ufo-border-light pb-2">
      <p className="text-xs font-semibold text-ufo-brand">{senderName}에게 답장</p>
      <p className="mt-0.5 truncate text-xs leading-5 text-ufo-text-subtle">{previewText}</p>
    </div>
  );
}

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

function getCalendarDateKey(createdAt: string | null) {
  if (!createdAt) {
    return null;
  }

  const date = new Date(createdAt);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function getMessageMinuteKey(createdAt: string | null) {
  if (!createdAt) {
    return null;
  }

  const date = new Date(createdAt);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}-${date.getMinutes()}`;
}

function getNormalizedSenderName(message: ChatMessage) {
  return message.senderName?.trim() || "뜨친";
}

function ChatMessageItem({
  currentUserName,
  message,
  messageById,
  showMessageTime,
  showSenderName,
  onDeleteFailedMessage,
  onReplyMessageSelect,
  onResendFailedMessage,
}: ChatMessageItemProps) {
  const longPressTimeoutRef = useRef<number | null>(null);
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const swipeOffsetRef = useRef(0);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isPressing, setIsPressing] = useState(false);
  const [isActionsDialogOpen, setIsActionsDialogOpen] = useState(false);

  const isMine =
    currentUserName !== null && message.senderName?.trim() === currentUserName.trim();
  const shouldTreatAsMine = isMine || message.status === "pending" || message.status === "failed";
  const isPending = message.status === "pending";
  const isFailed = message.status === "failed";
  const isDeleted = message.deletedAt !== null;
  const canReply = !isDeleted && message.status === "confirmed" && message.messageId !== null;
  const senderName = getNormalizedSenderName(message);
  const messageMetaText =
    isPending || isFailed || !showMessageTime ? null : formatMessageTime(message.createdAt);
  const repliedMessage =
    message.replyMessageId !== null && message.replyMessageId !== undefined
      ? messageById.get(message.replyMessageId)
      : undefined;
  const replySenderName = message.replySenderName?.trim();
  const replyPreviewText = repliedMessage?.deletedAt
    ? "관리자가 삭제한 메시지입니다"
    : repliedMessage?.text?.trim();
  const hasReply = Boolean(replySenderName && message.replyMessageId);

  const clearLongPress = () => {
    if (longPressTimeoutRef.current !== null) {
      window.clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }

    pointerStartRef.current = null;
  };

  const resetTouchInteraction = () => {
    clearLongPress();
    swipeOffsetRef.current = 0;
    setSwipeOffset(0);
    setIsPressing(false);
  };

  useEffect(() => {
    return () => {
      if (longPressTimeoutRef.current !== null) {
        window.clearTimeout(longPressTimeoutRef.current);
      }
    };
  }, []);

  if (isDeleted) {
    return (
      <article className="flex justify-center px-4 py-1">
        <p className="rounded-full bg-ufo-bg px-4 py-2 text-xs text-ufo-text-subtle">
          관리자가 삭제한 메시지입니다
        </p>
      </article>
    );
  }

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
    swipeOffsetRef.current = 0;
    setSwipeOffset(0);
    setIsPressing(true);
    longPressTimeoutRef.current = window.setTimeout(() => {
      setIsActionsDialogOpen(true);
      resetTouchInteraction();
    }, LONG_PRESS_DURATION_MS);
  };

  const handleTouchPointerMove = (clientX: number, clientY: number) => {
    const pointerStart = pointerStartRef.current;

    if (!pointerStart) {
      return;
    }

    const deltaX = clientX - pointerStart.x;
    const distanceX = Math.abs(deltaX);
    const distanceY = Math.abs(clientY - pointerStart.y);

    if (distanceY > LONG_PRESS_MOVE_TOLERANCE_PX && distanceY > distanceX) {
      resetTouchInteraction();
      return;
    }

    if (distanceX > LONG_PRESS_MOVE_TOLERANCE_PX) {
      if (longPressTimeoutRef.current !== null) {
        window.clearTimeout(longPressTimeoutRef.current);
        longPressTimeoutRef.current = null;
      }

      const swipeDirection = -1;
      const directionalDistance = deltaX * swipeDirection;
      const nextOffset =
        Math.min(Math.max(directionalDistance, 0), MAX_SWIPE_OFFSET_PX) * swipeDirection;
      swipeOffsetRef.current = nextOffset;
      setSwipeOffset(nextOffset);
    }
  };

  const handleTouchPointerUp = () => {
    if (Math.abs(swipeOffsetRef.current) >= SWIPE_REPLY_THRESHOLD_PX) {
      handleReplySelect();
    }

    resetTouchInteraction();
  };

  const timeSlot = messageMetaText ? (
    <div
      className={`flex shrink-0 items-end pb-1 ${
        shouldTreatAsMine ? "justify-start" : "justify-end"
      }`}
    >
      <p className="text-[11px] text-ufo-text-dim [@media(hover:hover)]:transition-opacity [@media(hover:hover)]:duration-150 [@media(hover:hover)]:group-hover/message:opacity-0 [@media(hover:hover)]:group-focus-within/message:opacity-0">
        {messageMetaText}
      </p>
    </div>
  ) : null;

  const desktopReplyButton = canReply ? (
    <button
      type="button"
      onClick={handleReplySelect}
      className={`absolute bottom-1 z-10 hidden w-12 whitespace-nowrap rounded-md border border-ufo-border-light bg-white px-1 py-[0.2rem] text-[11px] font-semibold text-ufo-brand opacity-0 shadow-none [@media(hover:hover)]:block [@media(hover:hover)]:transition-opacity [@media(hover:hover)]:duration-150 [@media(hover:hover)]:group-hover/message:opacity-100 [@media(hover:hover)]:group-focus-within/message:opacity-100 ${
        shouldTreatAsMine
          ? "right-[calc(100%+0.375rem)]"
          : "left-[calc(100%+0.375rem)]"
      }`}
      aria-label={`${senderName} 메시지에 답장`}
    >
      답장
    </button>
  ) : null;

  return (
    <div
      key={message.clientMessageId ?? message.messageId ?? message.createdAt}
      className={shouldTreatAsMine ? "relative flex flex-col items-end gap-1" : "relative flex flex-col gap-1"}
    >
      {swipeOffset !== 0 ? (
        <span
          className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs font-semibold text-ufo-brand"
          aria-hidden="true"
        >
          답장
        </span>
      ) : null}
      <article
        className={`group/message flex w-full touch-pan-y gap-1.5 transition-[transform,opacity] duration-150 [@media(pointer:coarse)]:select-none [@media(pointer:coarse)]:[-webkit-touch-callout:none] ${
          shouldTreatAsMine ? "justify-end" : "justify-start"
        } ${isPressing ? "opacity-80" : "opacity-100"}`}
        style={{ transform: `translateX(${swipeOffset}px)` }}
        onContextMenu={(event) => {
          event.preventDefault();
        }}
        onPointerCancel={() => {
          resetTouchInteraction();
        }}
        onPointerDown={(event) => {
          if (event.pointerType !== "touch") {
            return;
          }

          event.currentTarget.setPointerCapture(event.pointerId);
          handleTouchPointerDown(event.clientX, event.clientY);
        }}
        onPointerLeave={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            return;
          }

          resetTouchInteraction();
        }}
        onPointerMove={(event) => {
          if (event.pointerType !== "touch") {
            return;
          }

          handleTouchPointerMove(event.clientX, event.clientY);
        }}
        onPointerUp={(event) => {
          if (event.pointerType !== "touch") {
            return;
          }

          handleTouchPointerUp();

          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
          }
        }}
      >
        {!shouldTreatAsMine ? (
          <div className="relative max-w-[78%]">
            {showSenderName ? (
              <p className="mb-1 text-sm font-semibold text-ufo-text-subtle">{senderName}</p>
            ) : null}
            <div className="rounded-xl bg-ufo-bg px-4 py-2.5 text-sm text-ufo-text">
              {hasReply ? (
                <ReplyPreview
                  senderName={replySenderName as string}
                  text={replyPreviewText ?? null}
                />
              ) : null}
              <p className="whitespace-pre-wrap break-words leading-6">{message.text}</p>
            </div>
            {desktopReplyButton}
          </div>
        ) : null}

        {timeSlot}

        {shouldTreatAsMine ? (
          <div className="flex max-w-[78%] items-end gap-2">
            {isPending ? <ChatMessageSendingIndicator /> : null}
            <div className="relative max-w-full rounded-xl bg-ufo-brand-pale px-4 py-2.5 text-sm text-ufo-text">
              {hasReply ? (
                <ReplyPreview
                  senderName={replySenderName as string}
                  text={replyPreviewText ?? null}
                />
              ) : null}
              <p className="whitespace-pre-wrap break-words leading-6">{message.text}</p>
              {desktopReplyButton}
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

      {isActionsDialogOpen ? (
        <ChatMessageActionsDialog
          actions={[
            {
              label: "답장",
              onSelect: () => {
                setIsActionsDialogOpen(false);
                handleReplySelect();
              },
            },
          ]}
          onClose={() => setIsActionsDialogOpen(false)}
        />
      ) : null}
    </div>
  );
}

export default function ChatMessageList({
  messages,
  currentUserName,
  isLoading,
  errorMessage,
  lastReadMessageId = null,
  onLastReadMarkerRefChange,
  onRetry,
  onDeleteFailedMessage,
  onReplyMessageSelect,
  onResendFailedMessage,
}: ChatMessageListProps) {
  if (isLoading) {
    return <StateBlock type="loading" title="메시지를 불러오는 중입니다." variant="plain" />;
  }

  if (errorMessage) {
    return (
      <StateBlock
        type="error"
        title={errorMessage}
        actionLabel="다시 시도"
        onAction={onRetry}
        variant={onRetry ? "card" : "plain"}
      />
    );
  }

  if (messages.length === 0) {
    return <StateBlock type="empty" title="아직 메시지가 없습니다." variant="plain" />;
  }

  const messageById = new Map(
    messages
      .filter((message): message is ChatMessage & { messageId: string } => message.messageId !== null)
      .map((message) => [message.messageId, message] as const),
  );

  return (
    <div>
      {messages.map((message, index) => {
        const messageKey = message.clientMessageId ?? message.messageId ?? message.createdAt;
        const previousMessage = messages[index - 1];
        const nextMessage = messages[index + 1];
        const currentDateKey = getCalendarDateKey(message.createdAt);
        const previousDateKey = getCalendarDateKey(previousMessage?.createdAt ?? null);
        const shouldShowDateSeparator =
          message.createdAt !== null && currentDateKey !== previousDateKey;
        const senderName = getNormalizedSenderName(message);
        const isSameSenderAsPrevious =
          previousMessage !== undefined &&
          message.deletedAt === null &&
          previousMessage.deletedAt === null &&
          currentDateKey === previousDateKey &&
          getNormalizedSenderName(previousMessage) === senderName;
        const isSameSenderAndMinuteAsNext =
          nextMessage !== undefined &&
          message.deletedAt === null &&
          nextMessage.deletedAt === null &&
          getNormalizedSenderName(nextMessage) === senderName &&
          getMessageMinuteKey(nextMessage.createdAt) === getMessageMinuteKey(message.createdAt);
        const shouldShowLastReadSeparator = message.messageId === lastReadMessageId;
        const messageSpacingClass =
          index === 0 ? undefined : isSameSenderAsPrevious ? "mt-3" : "mt-5";

        return (
          <div
            key={messageKey}
            className={`${messageSpacingClass ?? ""} ${shouldShowDateSeparator ? "space-y-5" : ""}`}
          >
            {shouldShowDateSeparator ? (
              <ChatDateSeparator
                createdAt={message.createdAt as string}
              />
            ) : null}
            {shouldShowLastReadSeparator ? (
              <ChatLastReadSeparator ref={onLastReadMarkerRefChange} />
            ) : null}
            <ChatMessageItem
              currentUserName={currentUserName}
              message={message}
              messageById={messageById}
              showMessageTime={!isSameSenderAndMinuteAsNext}
              showSenderName={!isSameSenderAsPrevious}
              onDeleteFailedMessage={onDeleteFailedMessage}
              onReplyMessageSelect={onReplyMessageSelect}
              onResendFailedMessage={onResendFailedMessage}
            />
          </div>
        );
      })}
    </div>
  );
}
