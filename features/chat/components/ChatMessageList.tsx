import type { ChatMessage } from "@/features/chat/types";

type ChatMessageListProps = {
  messages: ChatMessage[];
  isLoading: boolean;
  errorMessage: string | null;
};

export default function ChatMessageList({
  messages,
  isLoading,
  errorMessage,
}: ChatMessageListProps) {
  if (isLoading) {
    return <p className="px-4 py-6 text-sm text-[#9a9a9a]">메시지를 불러오는 중입니다.</p>;
  }

  if (errorMessage) {
    return <p className="px-4 py-6 text-sm text-[#d35d5d]">{errorMessage}</p>;
  }

  if (messages.length === 0) {
    return <p className="px-4 py-6 text-sm text-[#9a9a9a]">아직 메시지가 없습니다.</p>;
  }

  return (
    <>
      {messages.map((message) => {
        if (message.sender === "other") {
          return (
            <article key={message.id} className="flex gap-2">
              <div className="mt-1 h-8 w-8 shrink-0 rounded-full bg-[#f5e9e5]" aria-hidden="true" />

              <div className="max-w-[78%]">
                <p className="mb-1 text-sm font-semibold text-[#8d8d8d]">{message.senderName}</p>
                <div className="rounded-xl bg-[#e5e5e5] p-3 text-[#6e6e6e]">
                  {message.lines.map((line, index) => (
                    <p
                      key={`${message.id}-${index}`}
                      className={`leading-tight ${
                        index === 0
                          ? "text-xs font-semibold"
                          : index === 1
                            ? "mt-1 text-[11px] leading-4 text-[#9d9d9d]"
                            : "mt-2 text-base"
                      }`}
                    >
                      {line}
                    </p>
                  ))}
                </div>
              </div>

              <p className="self-end pb-1 text-[11px] text-[#b3b3b3]">{message.time}</p>
            </article>
          );
        }

        return (
          <article key={message.id} className="flex justify-end gap-2">
            <p className="self-end pb-1 text-[11px] text-[#b3b3b3]">{message.time}</p>
            <div className="max-w-[72%] rounded-xl bg-[#fff1ed] px-4 py-3 text-base text-[#777777]">
              {message.lines[0]}
            </div>
          </article>
        );
      })}
    </>
  );
}
