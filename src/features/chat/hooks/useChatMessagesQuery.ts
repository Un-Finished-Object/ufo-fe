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

function hasMessage(data: ChatMessagesInfiniteData, message: ChatMessage) {
  const nextMessageKey = getMessageCacheKey(message);

  if (!nextMessageKey) {
    return false;
  }

  return data.pages.some((page) =>
    page.messages.some((messageItem) => getMessageCacheKey(messageItem) === nextMessageKey),
  );
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

  if (hasMessage(data, nextMessage)) {
    return data;
  }

  return updateLatestMessagesPage(data, (messages) => [...messages, nextMessage]);
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
  let matchedPendingMessage = false;

  const pages = data.pages.map((page) => ({
    ...page,
    messages: page.messages.map((messageItem) => {
      if (!messageItem.clientMessageId || messageItem.clientMessageId !== nextMessage.clientMessageId) {
        return messageItem;
      }

      matchedPendingMessage = true;

      return {
        ...messageItem,
        messageId: nextMessage.messageId,
        senderName: nextMessage.senderName,
        replySenderName: nextMessage.replySenderName ?? null,
        replyMessageId: nextMessage.replyMessageId ?? null,
        text: nextMessage.text,
        createdAt: nextMessage.createdAt,
        status: "confirmed",
      } satisfies ChatMessage;
    }),
  }));

  const nextData = {
    ...data,
    pages,
  } satisfies ChatMessagesInfiniteData;

  if (matchedPendingMessage || hasMessage(nextData, nextMessage)) {
    return nextData;
  }

  return appendChatMessageToData(nextData, nextMessage);
}

export function flattenChatMessagesData(data?: ChatMessagesInfiniteData) {
  const messageKeys = new Set<string>();

  return (data?.pages ?? [])
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
    getNextPageParam: (lastPage) => (lastPage.hasNext ? lastPage.nextCursor : undefined),
    staleTime: QUERY_STALE_TIME.realtime,
  });
  const messages = useMemo(() => flattenChatMessagesData(query.data), [query.data]);

  return {
    ...query,
    data: messages,
  };
}
