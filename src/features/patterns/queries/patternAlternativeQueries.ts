import { queryOptions } from "@tanstack/react-query";
import { buildApiUrl } from "@/lib/api/client";
import { fetchWithAuthRetry } from "@/lib/fetch/fetchWithAuthRetry";
import { QUERY_STALE_TIME_MS } from "@/lib/query/client";

type PatternAlternativeItemResponse = {
  altId?: number;
  yarnId?: number;
  yarnName?: string;
  weight?: number;
  cost?: number;
  subComponent?: string;
  store?: string;
  length?: number;
  username?: string;
};

type PatternAlternativesResponse = {
  data?: {
    items?: PatternAlternativeItemResponse[];
  };
  error?: unknown;
};

export type PatternAlternativeItem = {
  altId: number;
  yarnId: number | null;
  yarnName: string;
  weight: number | null;
  cost: number | null;
  subComponent: string;
  store: string;
  length: number | null;
  username: string;
};

function getSafeText(value?: string | null) {
  const trimmedValue = value?.trim();
  return trimmedValue ? trimmedValue : "-";
}

function mapPatternAlternativeItem(
  item: PatternAlternativeItemResponse,
): PatternAlternativeItem | null {
  if (typeof item.altId !== "number" || typeof item.yarnName !== "string") {
    return null;
  }

  return {
    altId: item.altId,
    yarnId: typeof item.yarnId === "number" ? item.yarnId : null,
    yarnName: getSafeText(item.yarnName),
    weight: typeof item.weight === "number" ? item.weight : null,
    cost: typeof item.cost === "number" ? item.cost : null,
    subComponent: getSafeText(item.subComponent),
    store: getSafeText(item.store),
    length: typeof item.length === "number" ? item.length : null,
    username: getSafeText(item.username),
  };
}

export function patternAlternativesQueryKey(patternId: number) {
  return ["patternAlternatives", patternId] as const;
}

export async function fetchPatternAlternatives(
  patternId: number,
  { signal }: { signal?: AbortSignal } = {},
) {
  const response = await fetchWithAuthRetry({
    input: buildApiUrl(`/v1/patterns/${patternId}/alternatives`),
    init: {
      method: "GET",
      credentials: "include",
      signal,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to load pattern alternatives.");
  }

  const payload = (await response.json()) as PatternAlternativesResponse;

  if (payload.error || !payload.data || !Array.isArray(payload.data.items)) {
    throw new Error("Failed to load pattern alternatives.");
  }

  return payload.data.items
    .map(mapPatternAlternativeItem)
    .filter((item): item is PatternAlternativeItem => item !== null);
}

export function patternAlternativesQueryOptions(patternId: number) {
  return queryOptions({
    queryKey: patternAlternativesQueryKey(patternId),
    queryFn: ({ signal }) => fetchPatternAlternatives(patternId, { signal }),
    staleTime: QUERY_STALE_TIME_MS,
  });
}
