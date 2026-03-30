"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchChatMessages } from "@/features/chat/services/fetchChatMessages";
import type { ChatMessage } from "@/features/chat/types";

export function chatMessagesQueryKey(roomId: string | null) {
  return ["chatMessages", roomId] as const;
}

export function useChatMessagesQuery(roomId: string | null) {
  return useQuery<ChatMessage[]>({
    queryKey: chatMessagesQueryKey(roomId),
    enabled: roomId !== null,
    queryFn: async ({ signal }) => {
      if (roomId === null) {
        return [];
      }

      return fetchChatMessages(roomId, { signal });
    },
  });
}
