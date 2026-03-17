import type { ChatMessage } from "@/features/chat/types";

type ChatMessageListProps = {
  messages: ChatMessage[];
  currentUserId: string | null;
  isLoading: boolean;
  errorMessage: string | null;
};

function formatMessageTime(createdAt: string | null) {
  if (!createdAt) {
    return "";
  }

  const createdDate = new Date(createdAt);

  if (Number.isNaN(createdDate.getTime())) {
    return "";
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
        const isMine =
          (currentUserId !== null && message.senderId === currentUserId) || message.status === "pending";
        const senderName = message.senderName?.trim();
        const messageMetaText = message.status === "pending"
          ? "전송중"
          : formatMessageTime(message.createdAt);

        return (
          <article
            key={message.clientMessageId ?? message.messageId ?? message.createdAt}
            className={`flex gap-2 ${isMine ? "justify-end" : "justify-start"}`}
          >
            {!isMine ? (
              <div className="max-w-[78%]">
                {senderName ? (
                  <p className="mb-1 text-sm font-semibold text-ufo-text-subtle">{senderName}</p>
                ) : null}
                <div className="rounded-xl bg-ufo-bg px-4 py-3 text-sm text-ufo-text-secondary">
                  <p className="leading-6">{message.text}</p>
                </div>
              </div>
            ) : null}

            {messageMetaText ? (
              <p className="self-end pb-1 text-[11px] text-ufo-text-dim">{messageMetaText}</p>
            ) : null}

            {isMine ? (
              <div className="max-w-[72%] rounded-xl bg-[#fff1ed] px-4 py-3 text-sm text-ufo-text-secondary">
                <p className="leading-6">{message.text}</p>
              </div>
            ) : null}
          </article>
        );
      })}
    </>
  );
}
