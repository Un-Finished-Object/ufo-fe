"use client";

import { useRef } from "react";

type ChatInputReplyPreview = {
  senderName: string;
  text: string;
};

type ChatInputProps = {
  value: string;
  isSending: boolean;
  placeholder?: string;
  isSubmitDisabled?: boolean;
  replyPreview?: ChatInputReplyPreview | null;
  onChange: (value: string) => void;
  onCancelReply?: () => void;
  onSendMessage: () => void;
};

export default function ChatInput({
  value,
  isSending,
  placeholder = "뜨개감지(으)로 대화해보세요.",
  isSubmitDisabled = false,
  replyPreview = null,
  onChange,
  onCancelReply,
  onSendMessage,
}: ChatInputProps) {
  const isComposingRef = useRef(false);

  const handleSend = () => {
    if (isSubmitDisabled || isSending || value.trim().length === 0) {
      return;
    }

    onSendMessage();
  };

  return (
    <div className="rounded-xl border border-ufo-border bg-white">
      {replyPreview ? (
        <div className="flex items-start justify-between gap-3 border-b border-ufo-border-light bg-ufo-brand-pale px-4 py-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-ufo-brand">{replyPreview.senderName}에게 답장</p>
            <p className="mt-1 line-clamp-2 text-xs leading-5 text-ufo-text-secondary">
              {replyPreview.text}
            </p>
          </div>

          <button
            type="button"
            onClick={onCancelReply}
            className="shrink-0 text-xs font-semibold text-ufo-text-dim"
            aria-label="답장 취소"
          >
            취소
          </button>
        </div>
      ) : null}

      <form
        className="flex items-center px-4 py-3"
        aria-label="메시지 입력"
        onSubmit={(event) => {
          event.preventDefault();
          handleSend();
        }}
      >
        <label htmlFor="chat-message" className="sr-only">
          메시지 입력
        </label>
        <input
          id="chat-message"
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onCompositionStart={() => {
            isComposingRef.current = true;
          }}
          onCompositionEnd={() => {
            isComposingRef.current = false;
          }}
          onKeyDown={(event) => {
            if (event.key !== "Enter" || isComposingRef.current || event.nativeEvent.isComposing) {
              return;
            }

            event.preventDefault();
            handleSend();
          }}
          placeholder={placeholder}
          enterKeyHint="send"
          className="w-full bg-transparent text-sm font-semibold text-ufo-text-secondary placeholder:text-ufo-text-muted focus:outline-none"
        />
        <button
          type="submit"
          className="ml-2 shrink-0 whitespace-nowrap text-sm font-semibold text-ufo-brand disabled:text-ufo-text-muted"
          aria-label="메시지 보내기"
          disabled={isSubmitDisabled || isSending || value.trim().length === 0}
        >
          {isSending ? "전송중" : "보내기"}
        </button>
      </form>
    </div>
  );
}
