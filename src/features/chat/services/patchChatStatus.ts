import { fetchWithAuthRetry } from "@/lib/fetch/fetchWithAuthRetry";
import type { ChatStatus } from "@/features/chat/hooks/useChatStatusQuery";

type PatchChatStatusParams = {
  patternId: string;
  favorites?: boolean;
  hidden?: boolean;
};

type PatchChatStatusResponse = {
  data?: {
    chatId?: number;
    favorite?: boolean;
    isHidden?: boolean;
  };
  error?: unknown;
};

function getApiBase() {
  return process.env.NEXT_PUBLIC_API_BASE ?? "/api";
}

export async function patchChatStatus({
  patternId,
  favorites,
  hidden,
}: PatchChatStatusParams) {
  const apiBase = getApiBase();
  const response = await fetchWithAuthRetry({
    apiBase,
    input: `${apiBase}/v1/chat/${patternId}/status`,
    init: {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...(typeof favorites === "boolean" ? { favorites } : {}),
        ...(typeof hidden === "boolean" ? { hidden } : {}),
      }),
    },
  });

  if (response.status === 401) {
    throw new Error("Unauthorized");
  }

  if (!response.ok) {
    throw new Error("Failed to update chat status.");
  }

  const payload = (await response.json()) as PatchChatStatusResponse;

  if (
    payload.error ||
    !payload.data ||
    typeof payload.data.chatId !== "number" ||
    typeof payload.data.favorite !== "boolean" ||
    typeof payload.data.isHidden !== "boolean"
  ) {
    throw new Error("Failed to update chat status.");
  }

  return {
    chatId: payload.data.chatId,
    favorite: payload.data.favorite,
    isHidden: payload.data.isHidden,
  } satisfies ChatStatus;
}
