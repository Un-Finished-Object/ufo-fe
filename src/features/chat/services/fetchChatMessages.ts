import type { ChatMessage } from "@/features/chat/types";
import { fetchAuthenticated } from "@/lib/fetch/fetchAuthenticated";
import { buildApiUrl } from "@/lib/api/client";
import {
  createInvalidApiResponseError,
  throwApiError,
  throwApiPayloadError,
} from "@/lib/api/ApiError";

export const CHAT_MESSAGES_FORBIDDEN_MESSAGE = "구매하지 않은 채팅방입니다.";
const CHAT_MESSAGES_CURSOR_PARAM = "messageId";

type ChatMessageItem = {
  messageId?: number;
  clientMessageId?: string;
  senderName?: string;
  replySenderName?: string | null;
  replyMessageId?: number | string | null;
  text?: string;
  createdAt?: string | null;
};

type ChatMessagesResponse = {
  data?: {
    lastMessageId?: number;
    hasNext?: boolean;
    nextMessageId?: number | null;
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
  return message.senderName;
}

function getReplySenderName(message: ChatMessageItem) {
  return message.replySenderName ?? null;
}

function getReplyMessageId(message: ChatMessageItem) {
  return message.replyMessageId ?? null;
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
  const response = await fetchAuthenticated({
    input: buildApiUrl(`/v1/chat/${roomId}/messages${queryString ? `?${queryString}` : ""}`),
    init: {
      method: "GET",
      credentials: "include",
      signal,
    },
  });

  if (!response.ok) {
    await throwApiError(
      response,
      response.status === 403
        ? CHAT_MESSAGES_FORBIDDEN_MESSAGE
        : "Failed to load chat messages.",
    );
  }

  const payload = (await response.json()) as ChatMessagesResponse;

  if (payload.error) {
    throwApiPayloadError(payload.error, "Failed to load chat messages.");
  }

  if (!payload.data || !Array.isArray(payload.data.messages)) {
    throw createInvalidApiResponseError("Failed to load chat messages.");
  }

  const messages = payload.data.messages
    .filter(
      (message): message is ChatMessageItem & {
        messageId: number;
        text: string;
        createdAt: string;
      } =>
        typeof message.messageId === "number" &&
        typeof message.text === "string" &&
        typeof message.createdAt === "string" &&
        !Number.isNaN(Date.parse(message.createdAt)),
    )
    .map((message) => {
      const senderName = getSenderName(message);
      const replySenderName = getReplySenderName(message);
      const replyMessageId = getReplyMessageId(message);

      return {
        messageId: String(message.messageId),
        clientMessageId: typeof message.clientMessageId === "string" ? message.clientMessageId : undefined,
        senderName: typeof senderName === "string" ? senderName : undefined,
        replySenderName: typeof replySenderName === "string" ? replySenderName : null,
        replyMessageId:
          typeof replyMessageId === "number"
            ? String(replyMessageId)
            : typeof replyMessageId === "string"
              ? replyMessageId
              : null,
        text: message.text,
        createdAt: message.createdAt,
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
    nextCursor: fallbackNextCursor ?? oldestMessageId,
  } satisfies ChatMessagesPage;
}
