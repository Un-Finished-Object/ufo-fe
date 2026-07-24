import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import { buildApiUrl } from "@/lib/api/client";
import {
  createInvalidApiResponseError,
  throwApiError,
  throwApiPayloadError,
} from "@/lib/api/ApiError";
import { fetchAuthenticated } from "@/lib/fetch/fetchAuthenticated";
import { QUERY_STALE_TIME } from "@/lib/query/client";
import type { AdminChatMessage, AdminChatMessagePage, AdminChatRoom } from "@/features/admin/types";

type AdminChatRoomResponse = {
  chatId?: number;
  patternId?: number;
  chatName?: string;
  chatImageUrl?: string | null;
  unRead?: number;
  lastMessage?: string;
  lastMessageAt?: string;
  createdAt?: string;
};

type AdminChatListResponse = {
  data?: { chats?: AdminChatRoomResponse[]; page?: number; nextPages?: number };
  error?: unknown;
};

type AdminChatMessageResponse = {
  senderId?: number;
  senderName?: string;
  messageId?: number;
  text?: string;
  replySenderName?: string | null;
  replyMessageId?: number | null;
  createdAt?: string;
};

type AdminChatMessagesResponse = {
  data?: {
    chatId?: number;
    patternId?: number;
    chatName?: string;
    chatCreatedAt?: string;
    lastMessageId?: number | null;
    hasNext?: boolean;
    nextMessageId?: number | null;
    messages?: AdminChatMessageResponse[];
  };
  error?: unknown;
};

type DeleteAdminChatMessageResponse = {
  data?: { chatId?: number; messageId?: number; deletedAt?: string };
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
    typeof room.createdAt !== "string"
  ) return null;

  return {
    chatId: room.chatId,
    patternId: room.patternId,
    name: room.chatName,
    imageUrl: typeof room.chatImageUrl === "string" ? room.chatImageUrl : null,
    unreadCount: room.unRead,
    lastMessage: room.lastMessage,
    lastMessageAt: room.lastMessageAt,
    createdAt: room.createdAt,
  };
}

function parseMessage(message: AdminChatMessageResponse): AdminChatMessage | null {
  if (
    typeof message.senderId !== "number" ||
    typeof message.senderName !== "string" ||
    typeof message.messageId !== "number" ||
    typeof message.text !== "string" ||
    typeof message.createdAt !== "string"
  ) return null;

  return {
    id: message.messageId,
    senderId: message.senderId,
    senderName: message.senderName,
    text: message.text,
    createdAt: message.createdAt,
    replySenderName: typeof message.replySenderName === "string" ? message.replySenderName : null,
    replyMessageId: typeof message.replyMessageId === "number" ? message.replyMessageId : null,
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

export async function fetchAdminChatMessages({ chatId, beforeMessageId, signal }: { chatId: number; beforeMessageId: number | null; signal?: AbortSignal }) {
  const query = beforeMessageId === null ? "" : `?beforeMessageId=${beforeMessageId}`;
  const response = await fetchAuthenticated({
    input: buildApiUrl(`/v1/admin/chats/${chatId}/messages${query}`),
    init: { method: "GET", credentials: "include", signal },
  });
  if (!response.ok) await throwApiError(response, "Failed to load admin chat messages.");

  const payload = (await response.json()) as AdminChatMessagesResponse;
  if (payload.error) throwApiPayloadError(payload.error, "Failed to load admin chat messages.");
  const data = payload.data;
  if (!data || typeof data.chatId !== "number" || typeof data.patternId !== "number" || typeof data.chatName !== "string" || typeof data.chatCreatedAt !== "string" || typeof data.hasNext !== "boolean" || !Array.isArray(data.messages)) {
    throw createInvalidApiResponseError("Invalid admin chat messages response.");
  }
  const messages = data.messages.map(parseMessage);
  if (messages.some((message) => message === null)) throw createInvalidApiResponseError("Invalid admin chat message item.");

  return {
    chatId: data.chatId,
    patternId: data.patternId,
    chatName: data.chatName,
    chatCreatedAt: data.chatCreatedAt,
    lastMessageId: typeof data.lastMessageId === "number" ? data.lastMessageId : null,
    hasNext: data.hasNext,
    nextMessageId: typeof data.nextMessageId === "number" ? data.nextMessageId : null,
    messages: messages.filter((message): message is AdminChatMessage => message !== null),
  } satisfies AdminChatMessagePage;
}

export async function deleteAdminChatMessage(chatId: number, messageId: number) {
  const response = await fetchAuthenticated({
    input: buildApiUrl(`/v1/admin/chats/${chatId}/messages/${messageId}`),
    init: { method: "DELETE", credentials: "include" },
  });
  if (!response.ok) await throwApiError(response, "Failed to delete admin chat message.");
  const payload = (await response.json()) as DeleteAdminChatMessageResponse;
  if (payload.error) throwApiPayloadError(payload.error, "Failed to delete admin chat message.");
  if (!payload.data || payload.data.chatId !== chatId || payload.data.messageId !== messageId || typeof payload.data.deletedAt !== "string") {
    throw createInvalidApiResponseError("Invalid deleted admin chat message response.");
  }
  return payload.data;
}

export function adminChatListQueryOptions(page: number) {
  return queryOptions({
    queryKey: adminChatQueryKeys.list(page),
    queryFn: ({ signal }) => fetchAdminChatRooms(page, signal),
    staleTime: QUERY_STALE_TIME.critical,
    refetchOnMount: "always",
  });
}

export function adminChatMessagesQueryOptions(chatId: number) {
  return infiniteQueryOptions({
    queryKey: adminChatQueryKeys.messages(chatId),
    queryFn: ({ pageParam, signal }) => fetchAdminChatMessages({ chatId, beforeMessageId: pageParam, signal }),
    initialPageParam: null as number | null,
    getNextPageParam: (lastPage) => lastPage.hasNext ? lastPage.nextMessageId ?? undefined : undefined,
    refetchOnMount: "always",
  });
}
