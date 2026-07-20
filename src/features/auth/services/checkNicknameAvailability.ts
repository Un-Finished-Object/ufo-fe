import { buildApiUrl } from "@/lib/api/client";
import {
  createInvalidApiResponseError,
  throwApiError,
  throwApiPayloadError,
} from "@/lib/api/ApiError";
import { fetchAuthenticated } from "@/lib/fetch/fetchAuthenticated";

type NicknameCheckResponse = {
  data?: {
    exists?: boolean;
  };
  error?: unknown;
};

export async function checkNicknameAvailability(username: string, signal?: AbortSignal) {
  const response = await fetchAuthenticated({
    input: buildApiUrl(`/v1/users/nicknames/${encodeURIComponent(username)}/check`),
    init: { method: "GET", signal },
  });

  if (!response.ok) {
    await throwApiError(response, "Failed to check nickname availability.");
  }

  const payload = (await response.json()) as NicknameCheckResponse;

  if (payload.error) {
    throwApiPayloadError(payload.error, "Failed to check nickname availability.");
  }

  if (typeof payload.data?.exists !== "boolean") {
    throw createInvalidApiResponseError("Failed to check nickname availability.");
  }

  return !payload.data.exists;
}
