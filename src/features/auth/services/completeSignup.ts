import { buildApiUrl } from "@/lib/api/client";
import {
  createInvalidApiResponseError,
  throwApiError,
  throwApiPayloadError,
} from "@/lib/api/ApiError";
import { fetchAuthenticated } from "@/lib/fetch/fetchAuthenticated";

type CompleteSignupResponse = {
  data?: {
    userId?: number;
    userName?: string;
    profileImageUrl?: string;
    keywords?: string[];
  };
  error?: unknown;
};

export type CompleteSignupParams = {
  userName: string;
  profileImageKey: string | null;
  keywords: string[];
};

export async function completeSignup(params: CompleteSignupParams) {
  const response = await fetchAuthenticated({
    input: buildApiUrl("/v1/auth/signup"),
    init: {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    },
  });

  if (!response.ok) {
    await throwApiError(response, "Failed to complete signup.");
  }

  const payload = (await response.json()) as CompleteSignupResponse;

  if (payload.error) {
    throwApiPayloadError(payload.error, "Failed to complete signup.");
  }

  if (
    !payload.data ||
    typeof payload.data.userId !== "number" ||
    typeof payload.data.userName !== "string" ||
    typeof payload.data.profileImageUrl !== "string" ||
    !Array.isArray(payload.data.keywords) ||
    !payload.data.keywords.every((keyword) => typeof keyword === "string")
  ) {
    throw createInvalidApiResponseError("Failed to complete signup.");
  }

  return {
    userId: String(payload.data.userId),
    userName: payload.data.userName,
    profileImageUrl: payload.data.profileImageUrl,
    keywords: payload.data.keywords,
  };
}
