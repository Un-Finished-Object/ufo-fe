import { fetchWithAuthRetry } from "@/lib/fetch/fetchWithAuthRetry";
import { buildApiUrl } from "@/lib/api/client";

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
  const response = await fetchWithAuthRetry({
    input: buildApiUrl(`/v1/patterns/${patternId}/scrap`),
    init: {
      method: shouldScrap ? "POST" : "DELETE",
    },
  });

  if (response.status === 401) {
    throw new Error("Unauthorized");
  }

  if (!response.ok) {
    throw new Error("Failed to update pattern scrap.");
  }

  const payload = (await response.json()) as UpdatePatternScrapResponse;

  if (payload.error || !payload.data || payload.data.scrapped !== shouldScrap) {
    throw new Error("Failed to update pattern scrap.");
  }

  return {
    scrapped: payload.data.scrapped,
    scrapCount: typeof payload.data.scrapCount === "number" ? payload.data.scrapCount : 0,
  } satisfies UpdatePatternScrapResult;
}
