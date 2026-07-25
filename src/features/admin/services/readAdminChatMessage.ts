import { buildApiUrl } from "@/lib/api/client";
import {
  createInvalidApiResponseError,
  throwApiError,
  throwApiPayloadError,
} from "@/lib/api/ApiError";
import { fetchAuthenticated } from "@/lib/fetch/fetchAuthenticated";

type CheckAdminChatMessageResponse = {
  data?: {
    chatRoomId?: number;
    messageId?: number;
    checkedAt?: string;
  };
  error?: unknown;
};

export async function checkAdminChatMessage(chatRoomId: number, messageId: number) {
  const response = await fetchAuthenticated({
    input: buildApiUrl(`/v1/admin/chats/${chatRoomId}/messages/${messageId}/check`),
    init: {
      method: "POST",
      credentials: "include",
    },
  });

  if (!response.ok) {
    await throwApiError(response, "Failed to check admin chat message.");
  }

  const payload = (await response.json()) as CheckAdminChatMessageResponse;

  if (payload.error) {
    throwApiPayloadError(payload.error, "Failed to check admin chat message.");
  }

  if (
    !payload.data ||
    payload.data.chatRoomId !== chatRoomId ||
    payload.data.messageId !== messageId ||
    typeof payload.data.checkedAt !== "string" ||
    Number.isNaN(Date.parse(payload.data.checkedAt))
  ) {
    throw createInvalidApiResponseError("Invalid checked admin chat message response.");
  }

  return payload.data;
}
