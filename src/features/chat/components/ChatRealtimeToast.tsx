"use client";

type ChatRealtimeToastProps = {
  roomName: string;
  senderName: string;
  text: string;
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
  roomName,
  senderName,
  text,
}: ChatRealtimeToastProps) {
  return (
    <div
      className="fixed top-6 left-1/2 z-[80] w-[calc(100%-20px)] max-w-[410px] -translate-x-1/2 rounded-2xl bg-ufo-brand px-4 py-3 text-white shadow-lg ring-1 ring-white/10"
      role="status"
      aria-live="polite"
    >
      <p className="truncate text-sm leading-5 font-semibold">{roomName}</p>
      <p className="mt-0.5 truncate text-[13px] leading-5 text-white/75">{senderName}</p>
      <p className="mt-1 text-sm leading-5">{truncateMessage(text)}</p>
    </div>
  );
}
