import { queryOptions } from "@tanstack/react-query";
import { buildApiUrl } from "@/lib/api/client";
import { fetchAuthenticated } from "@/lib/fetch/fetchAuthenticated";
import { QUERY_STALE_TIME } from "@/lib/query/client";
import {
  createInvalidApiResponseError,
  throwApiError,
  throwApiPayloadError,
} from "@/lib/api/ApiError";

type PatternAlternativeItemResponse = {
  altId?: number | null;
  ranking?: number | null;
  yarnId?: number | null;
  yarnName?: string | null;
  ply?: number | null;
  weight?: number | null;
  cost?: number | null;
  component?: string | null;
  store?: string | null;
  length?: number | null;
  componentScore?: number | null;
  lengthScore?: number | null;
  gaugeScore?: number | null;
  needleScore?: number | null;
  username?: string | null;
};

type PatternAlternativeSetResponse = {
  originalYarnSetId?: number | null;
  firstYarn?: PatternAlternativeItemResponse[] | null;
  secondYarn?: PatternAlternativeItemResponse[] | null;
  subYarn?: PatternAlternativeItemResponse[] | null;
};

type PatternAlternativesResponse = {
  data?: PatternAlternativeSetResponse;
  error?: unknown;
};

export type PatternAlternativeItem = {
  altId: number | null;
  ranking: number | null;
  yarnId: number | null;
  yarnName: string;
  ply: number | null;
  weight: number | null;
  cost: number | null;
  component: string;
  store: string;
  length: number | null;
  componentScore: number | null;
  lengthScore: number | null;
  gaugeScore: number | null;
  needleScore: number | null;
  username: string;
};

export type PatternAlternativeSet = {
  originalYarnSetId: number | null;
  firstYarn: PatternAlternativeItem[];
  secondYarn: PatternAlternativeItem[];
  subYarn: PatternAlternativeItem[];
};

function getSafeText(value?: string | null) {
  const trimmedValue = value?.trim();
  return trimmedValue ? trimmedValue : "";
}

function mapPatternAlternativeItem(
  item: PatternAlternativeItemResponse,
): PatternAlternativeItem {
  return {
    altId: typeof item.altId === "number" ? item.altId : null,
    ranking: typeof item.ranking === "number" ? item.ranking : null,
    yarnId: typeof item.yarnId === "number" ? item.yarnId : null,
    yarnName: getSafeText(item.yarnName),
    ply: typeof item.ply === "number" ? item.ply : null,
    weight: typeof item.weight === "number" ? item.weight : null,
    cost: typeof item.cost === "number" ? item.cost : null,
    component: getSafeText(item.component),
    store: getSafeText(item.store),
    length: typeof item.length === "number" ? item.length : null,
    componentScore: typeof item.componentScore === "number" ? item.componentScore : null,
    lengthScore: typeof item.lengthScore === "number" ? item.lengthScore : null,
    gaugeScore: typeof item.gaugeScore === "number" ? item.gaugeScore : null,
    needleScore: typeof item.needleScore === "number" ? item.needleScore : null,
    username: getSafeText(item.username),
  };
}

function mapPatternAlternativeItems(items?: PatternAlternativeItemResponse[] | null) {
  return Array.isArray(items) ? items.map(mapPatternAlternativeItem) : [];
}

function mapPatternAlternativeSet(
  item: PatternAlternativeSetResponse,
): PatternAlternativeSet {
  return {
    originalYarnSetId:
      typeof item.originalYarnSetId === "number" ? item.originalYarnSetId : null,
    firstYarn: mapPatternAlternativeItems(item.firstYarn),
    secondYarn: mapPatternAlternativeItems(item.secondYarn),
    subYarn: mapPatternAlternativeItems(item.subYarn),
  };
}

export function patternAlternativesQueryKey(originalYarnSetId: number) {
  return ["patternAlternatives", originalYarnSetId] as const;
}

export const patternAlternativesQueryRoot = ["patternAlternatives"] as const;

export async function fetchPatternAlternatives(
  originalYarnSetId: number,
  { signal }: { signal?: AbortSignal } = {},
) {
  const response = await fetchAuthenticated({
    input: buildApiUrl(`/v1/yarns/alternatives/${originalYarnSetId}`),
    init: {
      method: "GET",
      credentials: "include",
      signal,
    },
  });

  if (!response.ok) {
    await throwApiError(response, "Failed to load pattern alternatives.");
  }

  const payload = (await response.json()) as PatternAlternativesResponse;

  if (payload.error) {
    throwApiPayloadError(payload.error, "Failed to load pattern alternatives.");
  }

  if (!payload.data) {
    throw createInvalidApiResponseError("Failed to load pattern alternatives.");
  }

  return [mapPatternAlternativeSet(payload.data)];
}

export function patternAlternativesQueryOptions(originalYarnSetId: number) {
  return queryOptions({
    queryKey: patternAlternativesQueryKey(originalYarnSetId),
    queryFn: ({ signal }) => fetchPatternAlternatives(originalYarnSetId, { signal }),
    staleTime: QUERY_STALE_TIME.reference,
  });
}
