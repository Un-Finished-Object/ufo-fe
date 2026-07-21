import { infiniteQueryOptions, queryOptions, type InfiniteData } from "@tanstack/react-query";
import type { ChatRoom } from "@/features/chat/types";
import { buildApiUrl } from "@/lib/api/client";
import {
  createInvalidApiResponseError,
  throwApiError,
  throwApiPayloadError,
} from "@/lib/api/ApiError";
import { fetchAuthenticated } from "@/lib/fetch/fetchAuthenticated";
import { QUERY_STALE_TIME } from "@/lib/query/client";

type MyChatItem = {
  patternId?: number;
  chatId?: number;
  chatName?: string;
  chatImageUrl?: string | null;
  nickname?: string;
  favorite?: boolean;
  isHidden?: boolean;
  unRead?: number;
  lastMessage?: string | null;
  createdAt?: string;
};

type MyChatsResponse = {
  data?: {
    chats?: MyChatItem[];
    page?: number;
    nextPage?: number;
  };
  error?: unknown;
};

type ValidMyChatItem = MyChatItem & {
  patternId: number;
  chatId: number;
  chatName: string;
  nickname: string;
  favorite: boolean;
  isHidden: boolean;
  unRead: number;
  createdAt: string;
};

function isValidMyChatItem(chat: MyChatItem): chat is ValidMyChatItem {
  return (
    typeof chat.patternId === "number" &&
    typeof chat.chatId === "number" &&
    typeof chat.chatName === "string" &&
    typeof chat.nickname === "string" &&
    typeof chat.favorite === "boolean" &&
    typeof chat.isHidden === "boolean" &&
    typeof chat.unRead === "number" &&
    typeof chat.createdAt === "string"
  );
}

export const myChatRoomsQueryKey = ["myChatRooms"] as const;
export const allMyChatRoomsQueryKey = [...myChatRoomsQueryKey, "all"] as const;

export function myChatRoomsPageQueryKey(page: number) {
  return [...myChatRoomsQueryKey, "page", page] as const;
}

type MyChatRoomsQueryOptionsParams = {
  enabled?: boolean;
  page?: number;
};

export type MyChatRoomsResult = {
  rooms: ChatRoom[];
  page: number;
  nextPage: number;
};

export type AllMyChatRoomsInfiniteData = InfiniteData<MyChatRoomsResult, number>;

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

export async function fetchMyChatRooms({
  page = 1,
  signal,
}: {
  page?: number;
  signal?: AbortSignal;
} = {}): Promise<MyChatRoomsResult> {
  const searchParams = new URLSearchParams({
    page: String(page),
  });
  const response = await fetchAuthenticated({
    input: buildApiUrl(`/v1/users/me/chats?${searchParams.toString()}`),
    init: {
      method: "GET",
      credentials: "include",
      signal,
    },
  });

  if (!response.ok) {
    await throwApiError(response, "Failed to load chat rooms.");
  }

  const payload = (await response.json()) as MyChatsResponse;

  if (payload.error) {
    throwApiPayloadError(payload.error, "Failed to load chat rooms.");
  }

  if (!payload.data || !Array.isArray(payload.data.chats)) {
    throw createInvalidApiResponseError("Failed to load chat rooms.");
  }

  if (
    payload.data.chats.some(
      (chat) => typeof chat.chatId !== "undefined" && !isValidMyChatItem(chat),
    )
  ) {
    throw createInvalidApiResponseError("Failed to load chat rooms.");
  }

  return {
    rooms: payload.data.chats
      .filter(isValidMyChatItem)
      .map((chat) => ({
        chatId: String(chat.chatId),
        patternId: String(chat.patternId),
        name: chat.chatName,
        nickname: chat.nickname,
        imageUrl: normalizeChatImageUrl(chat.chatImageUrl),
        lastMessage: typeof chat.lastMessage === "string" ? chat.lastMessage : "",
        favorite: chat.favorite,
        isHidden: chat.isHidden,
        unreadCount: chat.unRead,
        createdAt: chat.createdAt,
      } satisfies ChatRoom)),
    page: typeof payload.data.page === "number" ? payload.data.page : page,
    nextPage: typeof payload.data.nextPage === "number" ? payload.data.nextPage : 0,
  };
}

export function myChatRoomsQueryOptions(params: MyChatRoomsQueryOptionsParams = {}) {
  const page = params.page ?? 1;

  return queryOptions({
    queryKey: myChatRoomsPageQueryKey(page),
    enabled: params.enabled ?? true,
    queryFn: ({ signal }) => fetchMyChatRooms({ page, signal }),
    staleTime: QUERY_STALE_TIME.critical,
  });
}

export function allMyChatRoomsInfiniteQueryOptions({ enabled = true }: { enabled?: boolean } = {}) {
  return infiniteQueryOptions({
    queryKey: allMyChatRoomsQueryKey,
    enabled,
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) => fetchMyChatRooms({ page: pageParam, signal }),
    getNextPageParam: (lastPage, allPages) => {
      const nextPage = lastPage.nextPage;
      const fetchedPages = new Set(allPages.map((page) => page.page));

      if (nextPage <= lastPage.page || fetchedPages.has(nextPage)) {
        return undefined;
      }

      return nextPage;
    },
    staleTime: QUERY_STALE_TIME.critical,
  });
}

export function flattenMyChatRooms(data?: AllMyChatRoomsInfiniteData) {
  const roomById = new Map<string, ChatRoom>();

  data?.pages.forEach((page) => {
    page.rooms.forEach((room) => {
      roomById.set(room.chatId, room);
    });
  });

  return Array.from(roomById.values());
}
