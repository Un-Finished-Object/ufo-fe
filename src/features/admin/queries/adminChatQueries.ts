import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import {
  mergeChatMessagesInfiniteData,
  type ChatMessagesInfiniteData,
} from "@/features/chat/hooks/useChatMessagesQuery";
import {
  fetchChatMessages,
  type ChatMessagesPage,
} from "@/features/chat/services/fetchChatMessages";
import { buildApiUrl } from "@/lib/api/client";
import {
  createInvalidApiResponseError,
  throwApiError,
  throwApiPayloadError,
} from "@/lib/api/ApiError";
import { fetchAuthenticated } from "@/lib/fetch/fetchAuthenticated";
import { QUERY_STALE_TIME } from "@/lib/query/client";
import type { AdminChatRoom } from "@/features/admin/types";

type AdminChatRoomResponse = {
  chatId?: number;
  patternId?: number;
  chatName?: string;
  chatImageUrl?: string | null;
  unRead?: number;
  lastMessage?: string;
  lastMessageDeleted?: boolean;
  lastMessageAt?: string;
  createdAt?: string;
};

type AdminChatListResponse = {
  data?: { chats?: AdminChatRoomResponse[]; page?: number; nextPages?: number };
  error?: unknown;
};

type DeleteAdminChatMessageResponse = {
  data?: { chatRoomId?: number; messageId?: number; deletedAt?: string };
  error?: unknown;
};

export const adminChatQueryKeys = {
  root: ["admin", "chats"] as const,
  list: (page: number) => ["admin", "chats", "list", page] as const,
  messages: (chatId: number) => ["admin", "chats", "messages", chatId] as const,
};

function parseChatRoom(room: AdminChatRoomResponse): AdminChatRoom | null {
  if (
    typeof room.chatId !== "number" ||
    typeof room.patternId !== "number" ||
    typeof room.chatName !== "string" ||
    typeof room.unRead !== "number" ||
    typeof room.lastMessage !== "string" ||
    typeof room.lastMessageAt !== "string" ||
    Number.isNaN(Date.parse(room.lastMessageAt)) ||
    typeof room.createdAt !== "string" ||
    Number.isNaN(Date.parse(room.createdAt))
  ) return null;

  return {
    chatId: room.chatId,
    patternId: room.patternId,
    name: room.chatName,
    imageUrl: typeof room.chatImageUrl === "string" ? room.chatImageUrl : null,
    unreadCount: room.unRead,
    lastMessage: room.lastMessage,
    lastMessageDeleted: room.lastMessageDeleted === true,
    lastMessageAt: room.lastMessageAt,
    createdAt: room.createdAt,
  };
}

export async function fetchAdminChatRooms(page: number, signal?: AbortSignal) {
  const response = await fetchAuthenticated({
    input: buildApiUrl(`/v1/admin/chats?page=${page}`),
    init: { method: "GET", credentials: "include", signal },
  });
  if (!response.ok) await throwApiError(response, "Failed to load admin chat rooms.");

  const payload = (await response.json()) as AdminChatListResponse;
  if (payload.error) throwApiPayloadError(payload.error, "Failed to load admin chat rooms.");
  if (!payload.data || !Array.isArray(payload.data.chats) || typeof payload.data.page !== "number" || typeof payload.data.nextPages !== "number") {
    throw createInvalidApiResponseError("Invalid admin chat room response.");
  }

  const chats = payload.data.chats.map(parseChatRoom);
  if (chats.some((chat) => chat === null)) throw createInvalidApiResponseError("Invalid admin chat room item.");

  return {
    chats: chats
      .filter((chat): chat is AdminChatRoom => chat !== null)
      .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()),
    page: payload.data.page,
    nextPages: payload.data.nextPages,
  };
}

export async function deleteAdminChatMessage(chatRoomId: number, messageId: number) {
  const response = await fetchAuthenticated({
    input: buildApiUrl(`/v1/admin/chats/${chatRoomId}/messages/${messageId}`),
    init: { method: "DELETE", credentials: "include" },
  });
  if (!response.ok) await throwApiError(response, "Failed to delete admin chat message.");
  const payload = (await response.json()) as DeleteAdminChatMessageResponse;
  if (payload.error) throwApiPayloadError(payload.error, "Failed to delete admin chat message.");
  if (!payload.data || payload.data.chatRoomId !== chatRoomId || payload.data.messageId !== messageId || typeof payload.data.deletedAt !== "string") {
    throw createInvalidApiResponseError("Invalid deleted admin chat message response.");
  }
  return {
    chatRoomId,
    messageId,
    deletedAt: payload.data.deletedAt,
  };
}

export function adminChatListQueryOptions(page: number) {
  return queryOptions({
    queryKey: adminChatQueryKeys.list(page),
    queryFn: ({ signal }) => fetchAdminChatRooms(page, signal),
    staleTime: QUERY_STALE_TIME.critical,
    refetchOnMount: "always",
  });
}

export function adminChatMessagesQueryOptions(
  chatId: number,
  onInitialPageFetched?: (lastReadMessageId: string | null) => void,
) {
  return infiniteQueryOptions<
    ChatMessagesPage,
    Error,
    ChatMessagesInfiniteData,
    ReturnType<typeof adminChatQueryKeys.messages>,
    string | null
  >({
    queryKey: adminChatQueryKeys.messages(chatId),
    queryFn: async ({ pageParam, signal }) => {
      const page = await fetchChatMessages(String(chatId), {
        cursorMessageId: pageParam,
        signal,
      });

      if (pageParam === null) {
        onInitialPageFetched?.(page.lastReadMessageId);
      }

      return page;
    },
    initialPageParam: null,
    getNextPageParam: (lastPage, _allPages, _lastPageParam, allPageParams) => {
      if (!lastPage.hasNext) {
        return undefined;
      }

      if (
        !lastPage.nextCursor ||
        allPageParams.some((pageParam) => pageParam === lastPage.nextCursor)
      ) {
        throw new Error("Admin chat message pagination returned a missing or repeated cursor.");
      }

      return lastPage.nextCursor;
    },
    structuralSharing: (currentData, incomingData) =>
      mergeChatMessagesInfiniteData(
        currentData as ChatMessagesInfiniteData | undefined,
        incomingData as ChatMessagesInfiniteData,
      ),
    refetchOnMount: "always",
    staleTime: QUERY_STALE_TIME.realtime,
  });
}
