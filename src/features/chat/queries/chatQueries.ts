import { queryOptions } from "@tanstack/react-query";
import type { ChatRoom } from "@/features/chat/types";
import { buildApiUrl } from "@/lib/api/client";
import { fetchAuthenticated } from "@/lib/fetch/fetchAuthenticated";

type MyChatItem = {
  patternId?: number;
  chatId?: number;
  chatName?: string;
  chatImageUrl?: string | null;
  favorite?: boolean;
  isHidden?: boolean;
  unRead?: number;
  createdAt?: string;
};

type MyChatsResponse = {
  data?: {
    chats?: MyChatItem[];
  };
  error?: unknown;
};

type ValidMyChatItem = MyChatItem & {
  patternId: number;
  chatId: number;
  chatName: string;
  favorite: boolean;
  isHidden: boolean;
  unRead: number;
  createdAt: string;
};

export const myChatRoomsQueryKey = ["myChatRooms"] as const;

type MyChatRoomsQueryOptionsParams = {
  enabled?: boolean;
};

function normalizeChatImageUrl(chatImageUrl: string | null | undefined) {
  if (!chatImageUrl) {
    return null;
  }

  if (
    chatImageUrl.startsWith("http://") ||
    chatImageUrl.startsWith("https://") ||
    chatImageUrl.startsWith("/")
  ) {
    return chatImageUrl;
  }

  return `/${chatImageUrl}`;
}

export async function fetchMyChatRooms({ signal }: { signal?: AbortSignal } = {}) {
  const response = await fetchAuthenticated({
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
      (chat): chat is ValidMyChatItem =>
        typeof chat.patternId === "number" &&
        typeof chat.chatId === "number" &&
        typeof chat.chatName === "string" &&
        typeof chat.favorite === "boolean" &&
        typeof chat.isHidden === "boolean" &&
        typeof chat.unRead === "number" &&
        typeof chat.createdAt === "string",
    )
    .map((chat) => ({
      chatId: String(chat.chatId),
      patternId: String(chat.patternId),
      name: chat.chatName,
      imageUrl: normalizeChatImageUrl(chat.chatImageUrl),
      favorite: chat.favorite,
      isHidden: chat.isHidden,
      unreadCount: chat.unRead,
      createdAt: chat.createdAt,
    } satisfies ChatRoom));
}

export function myChatRoomsQueryOptions(params: MyChatRoomsQueryOptionsParams = {}) {
  return queryOptions({
    queryKey: myChatRoomsQueryKey,
    enabled: params.enabled ?? true,
    queryFn: ({ signal }) => fetchMyChatRooms({ signal }),
  });
}
