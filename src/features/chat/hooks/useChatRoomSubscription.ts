"use client";

import { type IMessage, type StompSubscription } from "@stomp/stompjs";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { chatMessagesQueryKey } from "@/features/chat/hooks/useChatMessagesQuery";
import type { ChatMessage } from "@/features/chat/types";
import { addStompConnectListener, getStompClient } from "@/features/chat/lib/stompClient";

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

function parseIncomingMessage(message: IMessage) {
  try {
    const event = JSON.parse(message.body) as ChatSubscriptionEvent;
    const normalizedMessage = event.payload ? normalizeCreatedMessage(event.payload) : null;

    if (event.eventType !== "MESSAGE_CREATED" || !normalizedMessage) {
      return null;
    }

    return {
      roomId: typeof event.roomId === "number" ? String(event.roomId) : null,
      message: normalizedMessage,
    };
  } catch {
    return null;
  }
}

export function useChatRoomSubscription(roomId: string | null) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!roomId) {
      return;
    }

    const client = getStompClient();
    let subscription: StompSubscription | null = null;

    const handleIncomingMessage = (message: IMessage) => {
      const event = parseIncomingMessage(message);

      if (!event || event.roomId !== roomId || !event.message) {
        return;
      }

      const nextMessage = event.message;

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
    };

    const subscribeToRoom = () => {
      subscription?.unsubscribe();
      subscription = client.subscribe(`/sub/chat/rooms/${roomId}`, handleIncomingMessage);
    };

    if (client.connected) {
      subscribeToRoom();
    }

    const removeConnectListener = addStompConnectListener(() => {
      subscribeToRoom();
    });

    return () => {
      removeConnectListener();
      subscription?.unsubscribe();
    };
  }, [queryClient, roomId]);
}
