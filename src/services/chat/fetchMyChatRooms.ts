import { fetchWithAuthRetry } from "@/lib/fetchWithAuthRetry";
import type { ChatRoom } from "@/features/chat/types";

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

function getApiBase() {
  return process.env.NEXT_PUBLIC_API_BASE ?? "/api";
}

export async function fetchMyChatRooms({ signal }: { signal?: AbortSignal } = {}) {
  const apiBase = getApiBase();
  const response = await fetchWithAuthRetry({
    apiBase,
    input: `${apiBase}/v1/users/me/chats`,
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
