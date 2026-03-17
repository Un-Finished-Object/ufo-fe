"use client";

import { useQuery } from "@tanstack/react-query";
import type { ChatRoom } from "@/features/chat/types";
import { fetchMyChatRooms } from "@/src/services/chat/fetchMyChatRooms";

export const myChatRoomsQueryKey = ["myChatRooms"] as const;

export function useMyChatRoomsQuery() {
  return useQuery<ChatRoom[]>({
    queryKey: myChatRoomsQueryKey,
    queryFn: ({ signal }) => fetchMyChatRooms({ signal }),
  });
}
