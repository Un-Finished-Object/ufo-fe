import "server-only";

import { cache } from "react";
import {
  normalizePatternDetailResponse,
  type PatternDetailResponse,
} from "@/features/patterns/lib/patternDetailData";
import { siteConfig } from "@/lib/metadata";
import { throwApiError } from "@/lib/api/ApiError";
import { isMockMode } from "@/mocks/config";
import { mockPatternDetails } from "@/mocks/fixtures/core";

function buildPublicPatternDetailApiUrl(patternId: number) {
  const apiProxyTarget = process.env.NEXT_API_PROXY_TARGET?.replace(/\/$/, "");
  const baseUrl = apiProxyTarget || siteConfig.url;

  return `${baseUrl}/v1/patterns/${patternId}`;
}

async function fetchPublicPatternDetail(patternId: number) {
  if (isMockMode()) {
    const pattern = mockPatternDetails[patternId];

    if (!pattern) {
      return null;
    }

    return normalizePatternDetailResponse({
      data: pattern as PatternDetailResponse["data"],
      error: null,
    });
  }

  const response = await fetch(buildPublicPatternDetailApiUrl(patternId), {
    method: "GET",
    next: { revalidate: 300 },
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    await throwApiError(response, "Failed to load public pattern detail.");
  }

  return normalizePatternDetailResponse(
    (await response.json()) as PatternDetailResponse,
  );
}

export const getPublicPatternDetail = cache(fetchPublicPatternDetail);
