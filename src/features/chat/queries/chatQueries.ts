import { queryOptions } from "@tanstack/react-query";
import type { ChatRoom } from "@/features/chat/types";
import { buildApiUrl } from "@/lib/api/client";
import { fetchWithAuthRetry } from "@/lib/fetch/fetchWithAuthRetry";

type MyChatItem = {
  chatId?: number;
  chatName?: string;
  favorite?: boolean;
  isHidden?: boolean;
  unRead?: number;
};

type MyChatsResponse = {
  data?: {
    chats?: MyChatItem[];
  };
  error?: unknown;
};

export const myChatRoomsQueryKey = ["myChatRooms"] as const;

type MyChatRoomsQueryOptionsParams = {
  enabled?: boolean;
};

export async function fetchMyChatRooms({ signal }: { signal?: AbortSignal } = {}) {
  const response = await fetchWithAuthRetry({
    input: buildApiUrl("/v1/users/me/chats"),
    init: {
      method: "GET",
      credentials: "include",
      signal,
    },
  });

  if (response.status === 401) {
    return [] satisfies ChatRoom[];
  }

  if (!response.ok) {
    throw new Error("Failed to load chat rooms.");
  }

  const payload = (await response.json()) as MyChatsResponse;

  if (payload.error || !payload.data || !Array.isArray(payload.data.chats)) {
    throw new Error("Failed to load chat rooms.");
  }

  return payload.data.chats
    .filter(
      (chat): chat is Required<MyChatItem> =>
        typeof chat.chatId === "number" &&
        typeof chat.chatName === "string" &&
        typeof chat.favorite === "boolean" &&
        typeof chat.isHidden === "boolean" &&
        typeof chat.unRead === "number",
    )
    .map((chat) => ({
      patternId: String(chat.chatId),
      name: chat.chatName,
      favorite: chat.favorite,
      isHidden: chat.isHidden,
      unreadCount: chat.unRead,
    } satisfies ChatRoom));
}

export function myChatRoomsQueryOptions(params: MyChatRoomsQueryOptionsParams = {}) {
  return queryOptions({
    queryKey: myChatRoomsQueryKey,
    enabled: params.enabled ?? true,
    queryFn: ({ signal }) => fetchMyChatRooms({ signal }),
  });
}
