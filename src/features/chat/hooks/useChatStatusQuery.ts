"use client";

import { useQuery } from "@tanstack/react-query";
import type { ChatRoom } from "@/features/chat/types";

export type ChatStatus = {
  chatId: number;
  favorite: boolean;
  isHidden: boolean;
};

export function chatStatusQueryKey(patternId: string) {
  return ["chatStatus", patternId] as const;
}

export function mapChatRoomToStatus(patternId: string, chatRoom?: ChatRoom) {
  const chatId = Number(chatRoom?.chatId ?? patternId);

  if (!chatRoom || Number.isNaN(chatId)) {
    return null;
  }

  return {
    chatId,
    favorite: chatRoom.favorite,
    isHidden: chatRoom.isHidden,
  } satisfies ChatStatus;
}

export function useChatStatusQuery(patternId: string) {
  return useQuery<ChatStatus | null>({
    queryKey: chatStatusQueryKey(patternId),
    queryFn: async () => null,
    enabled: false,
    staleTime: Number.POSITIVE_INFINITY,
  });
}
