import { fetchWithAuthRetry } from "@/lib/fetch/fetchWithAuthRetry";
import type { ChatStatus } from "@/features/chat/hooks/useChatStatusQuery";
import { buildApiUrl } from "@/lib/api/client";

type PatchChatStatusParams = {
  patternId: string;
  favorite?: boolean;
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

export async function patchChatStatus({
  patternId,
  favorite,
  hidden,
}: PatchChatStatusParams) {
  const response = await fetchWithAuthRetry({
    input: buildApiUrl(`/v1/chat/${patternId}/status`),
    init: {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...(typeof favorite === "boolean" ? { favorite } : {}),
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
