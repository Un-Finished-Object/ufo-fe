"use client";

import { type InfiniteData, useInfiniteQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import {
  fetchChatMessages,
  type ChatMessagesPage,
} from "@/features/chat/services/fetchChatMessages";
import type { ChatMessage } from "@/features/chat/types";
import { QUERY_STALE_TIME } from "@/lib/query/client";

const INITIAL_CHAT_MESSAGES_PAGE_PARAM = null;

export type ChatMessagesInfiniteData = InfiniteData<ChatMessagesPage, string | null>;

export function chatMessagesQueryKey(roomId: string | null) {
  return ["chatMessages", roomId] as const;
}

export const chatMessagesQueryRoot = ["chatMessages"] as const;

function createInitialChatMessagesData(messages: ChatMessage[] = []) {
  return {
    pages: [
      {
        messages,
        hasNext: false,
        nextCursor: null,
      },
    ],
    pageParams: [INITIAL_CHAT_MESSAGES_PAGE_PARAM],
  } satisfies ChatMessagesInfiniteData;
}

function getMessageCacheKey(message: ChatMessage) {
  return message.messageId ?? message.clientMessageId ?? null;
}

function getMessageTimestamp(message: ChatMessage) {
  if (!message.createdAt) {
    return Number.POSITIVE_INFINITY;
  }

  const timestamp = Date.parse(message.createdAt);

  return Number.isNaN(timestamp) ? Number.POSITIVE_INFINITY : timestamp;
}

function compareChatMessages(left: ChatMessage, right: ChatMessage) {
  const leftTimestamp = getMessageTimestamp(left);
  const rightTimestamp = getMessageTimestamp(right);

  if (leftTimestamp !== rightTimestamp) {
    return leftTimestamp - rightTimestamp;
  }

  if (left.messageId !== null && right.messageId !== null) {
    return Number(left.messageId) - Number(right.messageId);
  }

  return 0;
}

function findMatchingMessageIndex(messages: ChatMessage[], nextMessage: ChatMessage) {
  if (nextMessage.clientMessageId) {
    const clientMessageIndex = messages.findIndex(
      (message) => message.clientMessageId === nextMessage.clientMessageId,
    );

    if (clientMessageIndex >= 0) {
      return clientMessageIndex;
    }
  }

  if (nextMessage.messageId) {
    return messages.findIndex((message) => message.messageId === nextMessage.messageId);
  }

  return -1;
}

export function mergeAndSortChatMessages(
  currentMessages: ChatMessage[],
  incomingMessages: ChatMessage[],
) {
  const mergedMessages = [...currentMessages];

  incomingMessages.forEach((nextMessage) => {
    const matchingIndex = findMatchingMessageIndex(mergedMessages, nextMessage);

    if (matchingIndex < 0) {
      mergedMessages.push(nextMessage);
      return;
    }

    const currentMessage = mergedMessages[matchingIndex];
    const shouldKeepConfirmedMessage =
      currentMessage?.status === "confirmed" && nextMessage.status !== "confirmed";

    mergedMessages[matchingIndex] = shouldKeepConfirmedMessage
      ? currentMessage
      : {
          ...currentMessage,
          ...nextMessage,
        };
  });

  return mergedMessages.sort(compareChatMessages);
}

function updateLatestMessagesPage(
  previousData: ChatMessagesInfiniteData | undefined,
  updateMessages: (messages: ChatMessage[]) => ChatMessage[],
) {
  const data = previousData ?? createInitialChatMessagesData();
  const latestPageIndex = 0;

  return {
    ...data,
    pages: data.pages.map((page, index) =>
      index === latestPageIndex
        ? {
            ...page,
            messages: updateMessages(page.messages),
          }
        : page,
    ),
  } satisfies ChatMessagesInfiniteData;
}

export function appendChatMessageToData(
  previousData: ChatMessagesInfiniteData | undefined,
  nextMessage: ChatMessage,
) {
  const data = previousData ?? createInitialChatMessagesData();

  return updateLatestMessagesPage(data, (messages) =>
    mergeAndSortChatMessages(messages, [nextMessage]),
  );
}

export function markChatMessageFailedInData(
  previousData: ChatMessagesInfiniteData | undefined,
  clientMessageId: string,
) {
  const data = previousData ?? createInitialChatMessagesData();

  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      messages: page.messages.map((message) =>
        message.clientMessageId === clientMessageId
          ? {
              ...message,
              status: "failed",
            }
          : message,
      ),
    })),
  } satisfies ChatMessagesInfiniteData;
}

export function removeChatMessageFromData(
  previousData: ChatMessagesInfiniteData | undefined,
  clientMessageId: string,
) {
  const data = previousData ?? createInitialChatMessagesData();

  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      messages: page.messages.filter((message) => message.clientMessageId !== clientMessageId),
    })),
  } satisfies ChatMessagesInfiniteData;
}

export function upsertIncomingChatMessageInData(
  previousData: ChatMessagesInfiniteData | undefined,
  nextMessage: ChatMessage,
) {
  const data = previousData ?? createInitialChatMessagesData();
  const currentMessages = flattenChatMessagesData(data);
  const nextMessages = mergeAndSortChatMessages(currentMessages, [nextMessage]);

  return {
    ...data,
    pages: data.pages.map((page, index) => ({
      ...page,
      messages: index === 0 ? nextMessages : [],
    })),
  } satisfies ChatMessagesInfiniteData;
}

export function flattenChatMessagesData(data?: ChatMessagesInfiniteData) {
  const messageKeys = new Set<string>();

  const messages = (data?.pages ?? [])
    .slice()
    .reverse()
    .flatMap((page) => page.messages)
    .filter((message) => {
      const messageKey = getMessageCacheKey(message);

      if (!messageKey) {
        return true;
      }

      if (messageKeys.has(messageKey)) {
        return false;
      }

      messageKeys.add(messageKey);
      return true;
    });

  return messages.sort(compareChatMessages);
}

export function mergeChatMessagesInfiniteData(
  currentData: ChatMessagesInfiniteData | undefined,
  incomingData: ChatMessagesInfiniteData,
) {
  if (!currentData) {
    return incomingData;
  }

  const mergedMessages = mergeAndSortChatMessages(
    flattenChatMessagesData(incomingData),
    flattenChatMessagesData(currentData),
  );

  return {
    ...incomingData,
    pages: incomingData.pages.map((page, index) => ({
      ...page,
      messages: index === 0 ? mergedMessages : [],
    })),
  } satisfies ChatMessagesInfiniteData;
}

export function useChatMessagesQuery(roomId: string | null) {
  const query = useInfiniteQuery<
    ChatMessagesPage,
    Error,
    ChatMessagesInfiniteData,
    ReturnType<typeof chatMessagesQueryKey>,
    string | null
  >({
    queryKey: chatMessagesQueryKey(roomId),
    enabled: roomId !== null,
    initialPageParam: INITIAL_CHAT_MESSAGES_PAGE_PARAM,
    queryFn: async ({ pageParam, signal }) => {
      if (roomId === null) {
        return {
          messages: [],
          hasNext: false,
          nextCursor: null,
        } satisfies ChatMessagesPage;
      }

      return fetchChatMessages(roomId, {
        cursorMessageId: pageParam,
        signal,
      });
    },
    getNextPageParam: (lastPage, _allPages, _lastPageParam, allPageParams) => {
      if (!lastPage.hasNext) {
        return undefined;
      }

      if (
        !lastPage.nextCursor ||
        allPageParams.some((pageParam) => pageParam === lastPage.nextCursor)
      ) {
        throw new Error("Chat message pagination returned a missing or repeated cursor.");
      }

      return lastPage.nextCursor;
    },
    structuralSharing: (currentData, incomingData) =>
      mergeChatMessagesInfiniteData(
        currentData as ChatMessagesInfiniteData | undefined,
        incomingData as ChatMessagesInfiniteData,
      ),
    staleTime: QUERY_STALE_TIME.realtime,
  });
  const messages = useMemo(() => flattenChatMessagesData(query.data), [query.data]);

  return {
    ...query,
    data: messages,
  };
}
