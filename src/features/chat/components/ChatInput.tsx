"use client";

import { useRef } from "react";

type ChatInputProps = {
  value: string;
  isSending: boolean;
  isSubmitDisabled?: boolean;
  onChange: (value: string) => void;
  onSendMessage: () => void;
};

export default function ChatInput({
  value,
  isSending,
  isSubmitDisabled = false,
  onChange,
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
    <form
      className="flex items-center rounded-xl border border-[#f0b2b2] px-4 py-3"
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
        placeholder="뜨개감지(으)로 대화해보세요."
        enterKeyHint="send"
        className="w-full bg-transparent text-sm font-semibold text-[#7f7f7f] placeholder:text-[#a6a6a6] focus:outline-none"
      />
      <button
        type="submit"
        className="ml-2 shrink-0 whitespace-nowrap text-sm font-semibold text-[#4a82ff] disabled:text-[#a0b6f2]"
        aria-label="메시지 보내기"
        disabled={isSubmitDisabled || isSending || value.trim().length === 0}
      >
        {isSending ? "전송중" : "보내기"}
      </button>
    </form>
  );
}
