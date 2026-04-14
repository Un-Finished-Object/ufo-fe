import type { IMessage } from "@stomp/stompjs";
import type { QueryClient } from "@tanstack/react-query";
import { chatMessagesQueryKey } from "@/features/chat/hooks/useChatMessagesQuery";
import { myChatRoomsQueryKey } from "@/features/chat/queries/chatQueries";
import type { ChatMessage, ChatRoom } from "@/features/chat/types";

type MessageCreatedPayload = {
  messageId?: number | null;
  clientMessageId?: string | null;
  senderId?: number | null;
  senderName?: string | null;
  text?: string | null;
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
  queryClient.setQueryData<ChatMessage[]>(chatMessagesQueryKey(roomId), (previousMessages = []) => {
    const matchedPendingMessage = previousMessages.find(
      (messageItem) =>
        messageItem.clientMessageId &&
        messageItem.clientMessageId === nextMessage.clientMessageId,
    );

    if (matchedPendingMessage) {
      return previousMessages.map((messageItem) =>
        messageItem.clientMessageId === nextMessage.clientMessageId
          ? {
              ...messageItem,
              messageId: nextMessage.messageId,
              senderId: nextMessage.senderId,
              senderName: nextMessage.senderName,
              text: nextMessage.text,
              createdAt: nextMessage.createdAt,
              status: "confirmed",
            }
          : messageItem,
      );
    }

    const alreadyExists = previousMessages.some(
      (messageItem) => messageItem.messageId && messageItem.messageId === nextMessage.messageId,
    );

    if (alreadyExists) {
      return previousMessages;
    }

    return [...previousMessages, nextMessage];
  });
}

export function incrementUnreadCount(queryClient: QueryClient, roomId: string) {
  queryClient.setQueryData<ChatRoom[]>(myChatRoomsQueryKey, (previousRooms) =>
    previousRooms?.map((room) =>
      room.patternId === roomId
        ? {
            ...room,
            unreadCount: room.unreadCount + 1,
          }
        : room,
    ),
  );
}
