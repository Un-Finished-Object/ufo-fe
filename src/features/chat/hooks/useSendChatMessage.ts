"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import {
  appendChatMessageToData,
  chatMessagesQueryKey,
  markChatMessageFailedInData,
  removeChatMessageFromData,
  type ChatMessagesInfiniteData,
} from "@/features/chat/hooks/useChatMessagesQuery";
import { sendChatMessage } from "@/features/chat/services/sendChatMessage";
import type { ChatMessage } from "@/features/chat/types";

type UseSendChatMessageParams = {
  roomId: string;
  senderName?: string;
};

type SendMessageParams = {
  text: string;
  clientMessageId: string;
  replyMessageId?: string | null;
  replySenderName?: string | null;
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
  senderName,
  replyMessageId,
  replySenderName,
  text,
}: {
  clientMessageId: string;
  senderName?: string;
  replyMessageId?: string | null;
  replySenderName?: string | null;
  text: string;
}) {
  return {
    messageId: null,
    clientMessageId,
    senderName,
    replyMessageId: replyMessageId ?? null,
    replySenderName: replySenderName ?? null,
    text,
    createdAt: null,
    status: "pending",
  } satisfies ChatMessage;
}

type SendMessageOptions = {
  replyMessageId?: string | null;
  replySenderName?: string | null;
};

function normalizeReplyMessageId(replyMessageId?: string | null) {
  if (!replyMessageId) {
    return null;
  }

  const nextReplyMessageId = Number(replyMessageId);

  return Number.isFinite(nextReplyMessageId) ? nextReplyMessageId : null;
}

export function useSendChatMessage({
  roomId,
  senderName,
}: UseSendChatMessageParams) {
  const queryClient = useQueryClient();

  const removeMessageByClientMessageId = useCallback((clientMessageId: string) => {
    queryClient.setQueryData<ChatMessagesInfiniteData>(chatMessagesQueryKey(roomId), (previousData) =>
      removeChatMessageFromData(previousData, clientMessageId),
    );
  }, [queryClient, roomId]);

  const mutation = useMutation<void, Error, SendMessageParams, PendingMessageContext>({
    mutationFn: async ({ text, clientMessageId, replyMessageId }) => {
      await Promise.resolve(
        sendChatMessage({
          roomId: Number(roomId),
          text,
          clientMessageId,
          replyMessageId: normalizeReplyMessageId(replyMessageId),
        }),
      );
    },
    onMutate: async ({ text, clientMessageId, replyMessageId, replySenderName }) => {
      queryClient.setQueryData<ChatMessagesInfiniteData>(chatMessagesQueryKey(roomId), (previousData) =>
        appendChatMessageToData(
          previousData,
          buildPendingMessage({
            clientMessageId,
            senderName,
            replyMessageId,
            replySenderName,
            text,
          }),
        ),
      );

      return { clientMessageId };
    },
    onError: (_error, _variables, context) => {
      if (!context) {
        return;
      }

      queryClient.setQueryData<ChatMessagesInfiniteData>(chatMessagesQueryKey(roomId), (previousData) =>
        markChatMessageFailedInData(previousData, context.clientMessageId),
      );
    },
  });

  const sendMessage = useCallback((text: string, options: SendMessageOptions = {}) => {
    const normalizedText = text.trim();

    if (normalizedText.length === 0) {
      return null;
    }

    const clientMessageId = createClientMessageId();

    mutation.mutate({
      text: normalizedText,
      clientMessageId,
      replyMessageId: options.replyMessageId ?? null,
      replySenderName: options.replySenderName ?? null,
    });

    return clientMessageId;
  }, [mutation]);

  const sendMessageAsync = useCallback(async (text: string, options: SendMessageOptions = {}) => {
    const normalizedText = text.trim();

    if (normalizedText.length === 0) {
      return null;
    }

    const clientMessageId = createClientMessageId();

    await mutation.mutateAsync({
      text: normalizedText,
      clientMessageId,
      replyMessageId: options.replyMessageId ?? null,
      replySenderName: options.replySenderName ?? null,
    });

    return clientMessageId;
  }, [mutation]);

  const resendFailedMessage = useCallback((message: ChatMessage) => {
    if (message.status !== "failed" || !message.clientMessageId) {
      return null;
    }

    removeMessageByClientMessageId(message.clientMessageId);
    return sendMessage(message.text, {
      replyMessageId: message.replyMessageId ?? null,
      replySenderName: message.replySenderName ?? null,
    });
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
