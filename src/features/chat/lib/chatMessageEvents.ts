import type { IMessage } from "@stomp/stompjs";
import type { QueryClient } from "@tanstack/react-query";
import {
  chatMessagesQueryKey,
  type ChatMessagesInfiniteData,
  upsertIncomingChatMessageInData,
} from "@/features/chat/hooks/useChatMessagesQuery";
import { myChatRoomsQueryKey, type MyChatRoomsResult } from "@/features/chat/queries/chatQueries";
import type { ChatMessage } from "@/features/chat/types";

type MessageCreatedPayload = {
  messageId?: number | null;
  clientMessageId?: string | null;
  senderId?: number | null;
  senderProfile?: string | null;
  senderName?: string | null;
  text?: string | null;
  replySenderName?: string | null;
  replyMessageId?: number | null;
  createdAt?: string | null;
};

type ChatSubscriptionEvent = {
  eventType?: string | null;
  roomId?: number | null;
  payload?: MessageCreatedPayload | null;
};

export type IncomingChatMessageEvent = {
  roomId: string;
  message: ChatMessage;
};

function normalizeCreatedMessage(payload: MessageCreatedPayload) {
  if (
    typeof payload.messageId !== "number" ||
    typeof payload.clientMessageId !== "string" ||
    typeof payload.senderId !== "number" ||
    typeof payload.senderName !== "string" ||
    typeof payload.text !== "string" ||
    typeof payload.createdAt !== "string"
  ) {
    return null;
  }

  return {
    messageId: String(payload.messageId),
    clientMessageId: payload.clientMessageId,
    senderId: String(payload.senderId),
    senderName: payload.senderName,
    replySenderName: typeof payload.replySenderName === "string" ? payload.replySenderName : null,
    replyMessageId: typeof payload.replyMessageId === "number" ? String(payload.replyMessageId) : null,
    text: payload.text,
    createdAt: payload.createdAt,
    status: "confirmed",
  } satisfies ChatMessage;
}

export function parseIncomingChatMessageEvent(message: IMessage) {
  try {
    const event = JSON.parse(message.body) as ChatSubscriptionEvent;
    const normalizedMessage = event.payload ? normalizeCreatedMessage(event.payload) : null;

    if (
      event.eventType !== "MESSAGE_CREATED" ||
      !normalizedMessage ||
      typeof event.roomId !== "number"
    ) {
      return null;
    }

    return {
      roomId: String(event.roomId),
      message: normalizedMessage,
    } satisfies IncomingChatMessageEvent;
  } catch {
    return null;
  }
}

export function applyIncomingChatMessage(
  queryClient: QueryClient,
  roomId: string,
  nextMessage: ChatMessage,
) {
  queryClient.setQueryData<ChatMessagesInfiniteData>(chatMessagesQueryKey(roomId), (previousData) =>
    upsertIncomingChatMessageInData(previousData, nextMessage),
  );
}

export function updateChatRoomLastMessage(
  queryClient: QueryClient,
  roomId: string,
  lastMessage: string,
  options: { incrementUnread?: boolean } = {},
) {
  queryClient.setQueriesData<MyChatRoomsResult>(
    { queryKey: myChatRoomsQueryKey },
    (previousResult) =>
      previousResult
        ? {
            ...previousResult,
            rooms: previousResult.rooms.map((room) =>
              room.chatId === roomId
                ? {
                    ...room,
                    lastMessage,
                    unreadCount: options.incrementUnread ? room.unreadCount + 1 : room.unreadCount,
                  }
                : room,
            ),
          }
        : previousResult,
  );
}
