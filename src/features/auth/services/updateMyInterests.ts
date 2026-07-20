import { buildApiUrl } from "@/lib/api/client";
import { throwApiError, throwApiPayloadError } from "@/lib/api/ApiError";
import { fetchAuthenticated } from "@/lib/fetch/fetchAuthenticated";

type UpdateMyInterestsResponse = {
  data?: {
    keywords?: string[];
  };
  error?: unknown;
};

export async function updateMyInterests(keywords: string[]) {
  const response = await fetchAuthenticated({
    input: buildApiUrl("/v1/users/me/interests"),
    init: {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keywords }),
    },
  });

  if (!response.ok) {
    await throwApiError(response, "Failed to update interests.");
  }

  if (response.status === 204) {
    return keywords;
  }

  const responseText = await response.text();

  if (!responseText.trim()) {
    return keywords;
  }

  const payload = JSON.parse(responseText) as UpdateMyInterestsResponse;

  if (payload.error) {
    throwApiPayloadError(payload.error, "Failed to update interests.");
  }

  return Array.isArray(payload.data?.keywords) ? payload.data.keywords : keywords;
}
