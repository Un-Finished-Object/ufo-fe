import { fetchAuthenticated } from "@/lib/fetch/fetchAuthenticated";
import type { ChatStatus } from "@/features/chat/hooks/useChatStatusQuery";
import { buildApiUrl } from "@/lib/api/client";
import {
  createInvalidApiResponseError,
  throwApiError,
  throwApiPayloadError,
} from "@/lib/api/ApiError";

type PatchChatStatusParams = {
  chatId: string;
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
  chatId,
  favorite,
  hidden,
}: PatchChatStatusParams) {
  const response = await fetchAuthenticated({
    input: buildApiUrl(`/v1/chat/${chatId}/status`),
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

  if (!response.ok) {
    await throwApiError(response, "Failed to update chat status.");
  }

  const payload = (await response.json()) as PatchChatStatusResponse;

  if (
    !payload.data ||
    typeof payload.data.chatId !== "number" ||
    typeof payload.data.favorite !== "boolean" ||
    typeof payload.data.isHidden !== "boolean"
  ) {
    if (payload.error) {
      throwApiPayloadError(payload.error, "Failed to update chat status.");
    }

    throw createInvalidApiResponseError("Failed to update chat status.");
  }

  return {
    chatId: payload.data.chatId,
    favorite: payload.data.favorite,
    isHidden: payload.data.isHidden,
  } satisfies ChatStatus;
}
