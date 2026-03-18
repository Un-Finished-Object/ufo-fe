"use client";

import { type IMessage, type StompSubscription } from "@stomp/stompjs";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { chatMessagesQueryKey } from "@/features/chat/hooks/useChatMessagesQuery";
import type { ChatMessage } from "@/features/chat/types";
import { addStompConnectListener, getStompClient } from "@/features/chat/lib/stompClient";

type ChatSubscriptionMessage = {
  messageId?: number | string | null;
  clientMessageId?: string | null;
  senderId?: number | string | null;
  senderName?: string | null;
  text?: string | null;
  message?: string | null;
  content?: string | null;
  createdAt?: string | null;
  created_at?: string | null;
};

function normalizeChatMessage(payload: ChatSubscriptionMessage) {
  const text = payload.text ?? payload.message ?? payload.content;

  if (typeof text !== "string" || text.trim().length === 0) {
    return null;
  }

  return {
    messageId:
      typeof payload.messageId === "number"
        ? String(payload.messageId)
        : typeof payload.messageId === "string"
          ? payload.messageId
          : null,
    clientMessageId:
      typeof payload.clientMessageId === "string" && payload.clientMessageId.length > 0
        ? payload.clientMessageId
        : undefined,
    senderId:
      typeof payload.senderId === "number"
        ? String(payload.senderId)
        : typeof payload.senderId === "string"
          ? payload.senderId
          : null,
    senderName:
      typeof payload.senderName === "string" && payload.senderName.length > 0
        ? payload.senderName
        : undefined,
    text,
    createdAt:
      typeof payload.createdAt === "string"
        ? payload.createdAt
        : typeof payload.created_at === "string"
          ? payload.created_at
          : null,
    status: "confirmed",
  } satisfies ChatMessage;
}

function parseIncomingMessage(message: IMessage) {
  try {
    const payload = JSON.parse(message.body) as ChatSubscriptionMessage;
    return normalizeChatMessage(payload);
  } catch {
    return null;
  }
}

function isSameMessage(left: ChatMessage, right: ChatMessage) {
  if (left.messageId && right.messageId) {
    return left.messageId === right.messageId;
  }

  if (left.clientMessageId && right.clientMessageId) {
    return left.clientMessageId === right.clientMessageId;
  }

  return (
    left.senderId === right.senderId &&
    left.text === right.text &&
    left.createdAt === right.createdAt
  );
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
      const nextMessage = parseIncomingMessage(message);

      if (!nextMessage) {
        return;
      }

      queryClient.setQueryData<ChatMessage[]>(chatMessagesQueryKey(roomId), (previousMessages = []) => {
        if (previousMessages.some((messageItem) => isSameMessage(messageItem, nextMessage))) {
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
