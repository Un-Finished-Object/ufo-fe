import { fetchAuthenticated } from "@/lib/fetch/fetchAuthenticated";
import { buildApiUrl } from "@/lib/api/client";
import {
  createInvalidApiResponseError,
  throwApiError,
  throwApiPayloadError,
} from "@/lib/api/ApiError";

type UpdatePatternScrapResponse = {
  data?: {
    scrapped?: boolean;
    scrapCount?: number;
  };
  error?: unknown;
};

export type UpdatePatternScrapResult = {
  scrapped: boolean;
  scrapCount: number;
};

export async function updatePatternScrap({
  patternId,
  shouldScrap,
}: {
  patternId: number;
  shouldScrap: boolean;
}) {
  const response = await fetchAuthenticated({
    input: buildApiUrl(`/v1/patterns/${patternId}/scrap`),
    init: {
      method: shouldScrap ? "POST" : "DELETE",
    },
  });

  if (!response.ok) {
    await throwApiError(response, "Failed to update pattern scrap.");
  }

  const payload = (await response.json()) as UpdatePatternScrapResponse;

  if (payload.error) {
    throwApiPayloadError(payload.error, "Failed to update pattern scrap.");
  }

  if (!payload.data || payload.data.scrapped !== shouldScrap) {
    throw createInvalidApiResponseError("Failed to update pattern scrap.");
  }

  return {
    scrapped: payload.data.scrapped,
    scrapCount: typeof payload.data.scrapCount === "number" ? payload.data.scrapCount : 0,
  } satisfies UpdatePatternScrapResult;
}
