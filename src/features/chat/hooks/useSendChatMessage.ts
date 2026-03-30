"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { chatMessagesQueryKey } from "@/features/chat/hooks/useChatMessagesQuery";
import { sendChatMessage } from "@/features/chat/services/sendChatMessage";
import type { ChatMessage } from "@/features/chat/types";

type UseSendChatMessageParams = {
  roomId: string;
  senderId?: string | null;
  senderName?: string;
};

type SendMessageParams = {
  text: string;
  clientMessageId: string;
};

type PendingMessageContext = {
  clientMessageId: string;
};

function createClientMessageId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `temp-${crypto.randomUUID()}`;
  }

  return `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function buildPendingMessage({
  clientMessageId,
  senderId,
  senderName,
  text,
}: {
  clientMessageId: string;
  senderId?: string | null;
  senderName?: string;
  text: string;
}) {
  return {
    messageId: null,
    clientMessageId,
    senderId: senderId ?? null,
    senderName,
    text,
    createdAt: null,
    status: "pending",
  } satisfies ChatMessage;
}

export function useSendChatMessage({
  roomId,
  senderId = null,
  senderName,
}: UseSendChatMessageParams) {
  const queryClient = useQueryClient();

  const removeMessageByClientMessageId = useCallback((clientMessageId: string) => {
    queryClient.setQueryData<ChatMessage[]>(chatMessagesQueryKey(roomId), (previousMessages = []) =>
      previousMessages.filter((message) => message.clientMessageId !== clientMessageId),
    );
  }, [queryClient, roomId]);

  const mutation = useMutation<void, Error, SendMessageParams, PendingMessageContext>({
    mutationFn: async ({ text, clientMessageId }) => {
      await Promise.resolve(
        sendChatMessage({
          roomId: Number(roomId),
          text,
          clientMessageId,
        }),
      );
    },
    onMutate: async ({ text, clientMessageId }) => {
      queryClient.setQueryData<ChatMessage[]>(chatMessagesQueryKey(roomId), (previousMessages = []) => [
        ...previousMessages,
        buildPendingMessage({
          clientMessageId,
          senderId,
          senderName,
          text,
        }),
      ]);

      return { clientMessageId };
    },
    onError: (_error, _variables, context) => {
      if (!context) {
        return;
      }

      queryClient.setQueryData<ChatMessage[]>(chatMessagesQueryKey(roomId), (previousMessages = []) =>
        previousMessages.map((message) =>
          message.clientMessageId === context.clientMessageId
            ? {
                ...message,
                status: "failed",
              }
            : message,
        ),
      );
    },
  });

  const sendMessage = useCallback((text: string) => {
    const normalizedText = text.trim();

    if (normalizedText.length === 0) {
      return null;
    }

    const clientMessageId = createClientMessageId();

    mutation.mutate({
      text: normalizedText,
      clientMessageId,
    });

    return clientMessageId;
  }, [mutation]);

  const sendMessageAsync = useCallback(async (text: string) => {
    const normalizedText = text.trim();

    if (normalizedText.length === 0) {
      return null;
    }

    const clientMessageId = createClientMessageId();

    await mutation.mutateAsync({
      text: normalizedText,
      clientMessageId,
    });

    return clientMessageId;
  }, [mutation]);

  const resendFailedMessage = useCallback((message: ChatMessage) => {
    if (message.status !== "failed" || !message.clientMessageId) {
      return null;
    }

    removeMessageByClientMessageId(message.clientMessageId);
    return sendMessage(message.text);
  }, [removeMessageByClientMessageId, sendMessage]);

  const removeFailedMessage = useCallback((message: ChatMessage) => {
    if (message.status !== "failed" || !message.clientMessageId) {
      return;
    }

    removeMessageByClientMessageId(message.clientMessageId);
  }, [removeMessageByClientMessageId]);

  return {
    ...mutation,
    removeFailedMessage,
    resendFailedMessage,
    sendMessage,
    sendMessageAsync,
  };
}
