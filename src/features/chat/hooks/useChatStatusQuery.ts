"use client";

import { useQuery } from "@tanstack/react-query";
import type { ChatRoom } from "@/features/chat/types";

export type ChatStatus = {
  chatId: number;
  favorite: boolean;
  isHidden: boolean;
};

export function chatStatusQueryKey(chatId: string) {
  return ["chatStatus", chatId] as const;
}

export const chatStatusQueryRoot = ["chatStatus"] as const;

export function mapChatRoomToStatus(chatId: string, chatRoom?: ChatRoom) {
  const numericChatId = Number(chatRoom?.chatId ?? chatId);

  if (!chatRoom || Number.isNaN(numericChatId)) {
    return null;
  }

  return {
    chatId: numericChatId,
    favorite: chatRoom.favorite,
    isHidden: chatRoom.isHidden,
  } satisfies ChatStatus;
}

export function useChatStatusQuery(chatId: string) {
  return useQuery<ChatStatus | null>({
    queryKey: chatStatusQueryKey(chatId),
    queryFn: async () => null,
    enabled: false,
    staleTime: Number.POSITIVE_INFINITY,
  });
}
