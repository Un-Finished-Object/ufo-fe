import { buildApiUrl } from "@/lib/api/client";
import {
  createInvalidApiResponseError,
  throwApiError,
  throwApiPayloadError,
} from "@/lib/api/ApiError";
import { fetchAuthenticated } from "@/lib/fetch/fetchAuthenticated";

type PatternViewResponse = {
  data?: {
    viewCount?: number;
  };
  error?: unknown;
};

export async function recordPatternView(patternId: number) {
  const response = await fetchAuthenticated({
    input: buildApiUrl(`/v1/patterns/${patternId}/views`),
    init: {
      method: "POST",
    },
  });

  if (!response.ok) {
    await throwApiError(response, "Failed to record pattern view.");
  }

  const payload = (await response.json()) as PatternViewResponse;

  if (payload.error) {
    throwApiPayloadError(payload.error, "Failed to record pattern view.");
  }

  if (
    !payload.data ||
    typeof payload.data.viewCount !== "number" ||
    !Number.isFinite(payload.data.viewCount)
  ) {
    throw createInvalidApiResponseError("Invalid pattern view response.");
  }

  return payload.data.viewCount;
}
