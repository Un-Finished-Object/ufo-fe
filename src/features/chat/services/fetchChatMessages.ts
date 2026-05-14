import type { ChatMessage } from "@/features/chat/types";
import { fetchWithAuthRetry } from "@/lib/fetch/fetchWithAuthRetry";
import { buildApiUrl } from "@/lib/api/client";

export const CHAT_MESSAGES_FORBIDDEN_MESSAGE = "구매하지 않은 채팅방입니다.";
const CHAT_MESSAGES_CURSOR_PARAM = "messageId";

type ChatMessageItem = {
  messageId?: number;
  clientMessageId?: string;
  senderId?: number | string;
  senderName?: string;
  sender_name?: string;
  userName?: string;
  user_name?: string;
  replySenderName?: string | null;
  reply_sender_name?: string | null;
  replyMessageId?: number | string | null;
  reply_message_id?: number | string | null;
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

export type ChatMessagesPage = {
  messages: ChatMessage[];
  hasNext: boolean;
  nextCursor: string | null;
};

function getSenderName(message: ChatMessageItem) {
  return (
    message.senderName ??
    message.sender_name ??
    message.userName ??
    message.user_name ??
    undefined
  );
}

function getReplySenderName(message: ChatMessageItem) {
  return message.replySenderName ?? message.reply_sender_name ?? null;
}

function getReplyMessageId(message: ChatMessageItem) {
  return message.replyMessageId ?? message.reply_message_id ?? null;
}

export async function fetchChatMessages(
  roomId: string,
  {
    cursorMessageId = null,
    signal,
  }: {
    cursorMessageId?: string | null;
    signal?: AbortSignal;
  } = {},
) {
  const searchParams = new URLSearchParams();

  if (cursorMessageId) {
    searchParams.set(CHAT_MESSAGES_CURSOR_PARAM, cursorMessageId);
  }

  const queryString = searchParams.toString();
  const response = await fetchWithAuthRetry({
    input: buildApiUrl(`/v1/chat/${roomId}/messages${queryString ? `?${queryString}` : ""}`),
    init: {
      method: "GET",
      credentials: "include",
      signal,
    },
  });

  if (response.status === 401) {
    return {
      messages: [],
      hasNext: false,
      nextCursor: null,
    } satisfies ChatMessagesPage;
  }

  if (response.status === 403) {
    throw new Error(CHAT_MESSAGES_FORBIDDEN_MESSAGE);
  }

  if (!response.ok) {
    throw new Error("Failed to load chat messages.");
  }

  const payload = (await response.json()) as ChatMessagesResponse;

  if (payload.error || !payload.data || !Array.isArray(payload.data.messages)) {
    throw new Error("Failed to load chat messages.");
  }

  const messages = payload.data.messages
    .filter(
      (message): message is ChatMessageItem & { messageId: number; text: string } =>
        typeof message.messageId === "number" &&
        typeof message.text === "string",
    )
    .map((message) => {
      const senderName = getSenderName(message);
      const replySenderName = getReplySenderName(message);
      const replyMessageId = getReplyMessageId(message);

      return {
        messageId: String(message.messageId),
        clientMessageId: typeof message.clientMessageId === "string" ? message.clientMessageId : undefined,
        senderId:
          typeof message.senderId === "number"
            ? String(message.senderId)
            : typeof message.senderId === "string"
              ? message.senderId
              : null,
        senderName: typeof senderName === "string" ? senderName : undefined,
        replySenderName: typeof replySenderName === "string" ? replySenderName : null,
        replyMessageId:
          typeof replyMessageId === "number"
            ? String(replyMessageId)
            : typeof replyMessageId === "string"
              ? replyMessageId
              : null,
        text: message.text,
        createdAt: typeof message.createdAt === "string" ? message.createdAt : null,
        status: "confirmed",
      } satisfies ChatMessage;
    })
    .sort((left, right) => Number(left.messageId) - Number(right.messageId));

  const oldestMessageId = messages[0]?.messageId ?? null;
  const fallbackNextCursor =
    typeof payload.data.nextMessageId === "number" ? String(payload.data.nextMessageId) : null;

  return {
    messages,
    hasNext: payload.data.hasNext === true,
    nextCursor: oldestMessageId ?? fallbackNextCursor,
  } satisfies ChatMessagesPage;
}
