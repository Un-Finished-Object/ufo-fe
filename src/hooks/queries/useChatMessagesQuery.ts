"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchChatMessages } from "@/src/services/chat/fetchChatMessages";
import type { ChatMessage } from "@/src/types/chat";

export function chatMessagesQueryKey(roomId: string | null) {
  return ["chatMessages", roomId] as const;
}

export function useChatMessagesQuery(roomId: string | null) {
  return useQuery<ChatMessage[]>({
    queryKey: chatMessagesQueryKey(roomId),
    enabled: roomId !== null,
    queryFn: async () => {
      if (roomId === null) {
        return [];
      }

      return fetchChatMessages(roomId);
    },
  });
}
