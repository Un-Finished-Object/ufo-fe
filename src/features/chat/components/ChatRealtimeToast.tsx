"use client";

type ChatRealtimeToastProps = {
  messageCount: number;
  overflowCount: number;
  roomName: string;
  senderName: string;
  text: string;
  onClick: () => void;
  onPauseChange: (isPaused: boolean) => void;
};

const MAX_MESSAGE_LENGTH = 15;

function truncateMessage(text: string) {
  const normalizedText = text.trim();

  if (normalizedText.length <= MAX_MESSAGE_LENGTH) {
    return normalizedText;
  }

  return `${normalizedText.slice(0, MAX_MESSAGE_LENGTH)}...`;
}

export default function ChatRealtimeToast({
  messageCount,
  overflowCount,
  roomName,
  senderName,
  text,
  onClick,
  onPauseChange,
}: ChatRealtimeToastProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => onPauseChange(true)}
      onMouseLeave={() => onPauseChange(false)}
      onFocus={() => onPauseChange(true)}
      onBlur={() => onPauseChange(false)}
      className="fixed top-[max(1.5rem,env(safe-area-inset-top))] left-1/2 z-[80] w-[calc(100%-20px)] max-w-[410px] -translate-x-1/2 rounded-2xl bg-ufo-brand px-4 py-3 text-left text-white shadow-lg ring-1 ring-white/10"
      aria-label={`${roomName} 채팅방으로 이동`}
      aria-live="polite"
    >
      <p className="truncate text-sm leading-5 font-semibold">
        {roomName}{messageCount > 1 ? ` · 새 메시지 ${messageCount}개` : ""}
      </p>
      <p className="mt-0.5 truncate text-[13px] leading-5 text-white/75">{senderName}</p>
      <p className="mt-1 text-sm leading-5">{truncateMessage(text)}</p>
      {overflowCount > 0 ? (
        <p className="mt-1 text-xs leading-5 text-white/75">외 {overflowCount}개 알림</p>
      ) : null}
    </button>
  );
}
