import { buildApiUrl } from "@/lib/api/client";
import {
  createInvalidApiResponseError,
  throwApiError,
  throwApiPayloadError,
} from "@/lib/api/ApiError";
import { fetchAuthenticated } from "@/lib/fetch/fetchAuthenticated";

type ReadAdminChatMessageResponse = {
  data?: {
    chatRoomId?: number;
    messageId?: number;
    updatedAt?: string;
  };
  error?: unknown;
};

export async function readAdminChatMessage(chatRoomId: number, messageId: number) {
  const response = await fetchAuthenticated({
    input: buildApiUrl(`/v1/admin/chats/${chatRoomId}/messages/${messageId}/read`),
    init: {
      method: "POST",
      credentials: "include",
    },
  });

  if (!response.ok) {
    await throwApiError(response, "Failed to read admin chat message.");
  }

  const payload = (await response.json()) as ReadAdminChatMessageResponse;

  if (payload.error) {
    throwApiPayloadError(payload.error, "Failed to read admin chat message.");
  }

  if (
    !payload.data ||
    payload.data.chatRoomId !== chatRoomId ||
    payload.data.messageId !== messageId ||
    typeof payload.data.updatedAt !== "string" ||
    Number.isNaN(Date.parse(payload.data.updatedAt))
  ) {
    throw createInvalidApiResponseError("Invalid read admin chat message response.");
  }

  return payload.data;
}
