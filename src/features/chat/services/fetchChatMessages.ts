import type { ChatMessage } from "@/features/chat/types";
import { fetchWithAuthRetry } from "@/lib/fetch/fetchWithAuthRetry";

type ChatMessageItem = {
  messageId?: number;
  clientMessageId?: string;
  senderId?: number | string;
  senderName?: string;
  text?: string;
  createdAt?: string | null;
};

type ChatMessagesResponse = {
  data?: {
    lastMessageId?: number;
    hasNext?: boolean;
    nextMessageId?: number;
    messages?: ChatMessageItem[];
  };
  error?: unknown;
};

function getApiBase() {
  return process.env.NEXT_PUBLIC_API_BASE ?? "/api";
}

export async function fetchChatMessages(
  roomId: string,
  { signal }: { signal?: AbortSignal } = {},
) {
  const apiBase = getApiBase();
  const response = await fetchWithAuthRetry({
    apiBase,
    input: `${apiBase}/v1/chat/${roomId}/messages`,
    init: {
      method: "GET",
      credentials: "include",
      signal,
    },
  });

  if (response.status === 401) {
    return [] satisfies ChatMessage[];
  }

  if (!response.ok) {
    throw new Error("Failed to load chat messages.");
  }

  const payload = (await response.json()) as ChatMessagesResponse;

  if (payload.error || !payload.data || !Array.isArray(payload.data.messages)) {
    throw new Error("Failed to load chat messages.");
  }

  return payload.data.messages
    .filter(
      (message): message is ChatMessageItem & { messageId: number; text: string } =>
        typeof message.messageId === "number" &&
        typeof message.text === "string",
    )
    .map((message) => ({
      messageId: String(message.messageId),
      clientMessageId: typeof message.clientMessageId === "string" ? message.clientMessageId : undefined,
      senderId:
        typeof message.senderId === "number"
          ? String(message.senderId)
          : typeof message.senderId === "string"
            ? message.senderId
            : null,
      senderName: typeof message.senderName === "string" ? message.senderName : undefined,
      text: message.text,
      createdAt: typeof message.createdAt === "string" ? message.createdAt : null,
      status: "confirmed",
    } satisfies ChatMessage))
    .sort((left, right) => Number(left.messageId) - Number(right.messageId));
}
