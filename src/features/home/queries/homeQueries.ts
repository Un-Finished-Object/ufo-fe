import { queryOptions } from "@tanstack/react-query";
import { fetchAuthenticated } from "@/lib/fetch/fetchAuthenticated";
import { fetchOptionalAuth } from "@/lib/fetch/fetchOptionalAuth";
import { buildApiUrl } from "@/lib/api/client";
import { QUERY_STALE_TIME } from "@/lib/query/client";
import {
  createInvalidApiResponseError,
  throwApiError,
  throwApiPayloadError,
} from "@/lib/api/ApiError";

type PatternSort = "views" | "news";

type PatternApiItem = {
  id: number;
  title: string;
  thumbnailUrl: string | null;
  author: string;
  my?: {
    scrapped?: boolean;
  };
};

type PatternListResponse = {
  data?: {
    items?: PatternApiItem[];
  };
  error?: unknown;
};

type RecommendApiItem = {
  id: number;
  title: string;
  thumbnailUrl: string | null;
  author: string;
  my?: {
    scrapped?: boolean;
  };
};

type RecommendResponse = {
  data?: {
    items?: RecommendApiItem[];
  };
  error?: unknown;
};

type InterestsResponse = {
  data?: {
    keywords?: string[];
  };
  error?: unknown;
};

export type HomePatternItem = {
  id: number;
  title: string;
  author: string;
  image: string;
  isScrapped: boolean;
};

const PATTERN_FALLBACK_IMAGE = "/image/UFO.svg";
const MAX_RECOMMENDED_PATTERN_COUNT = 30;

function mapPatternItems(items: PatternApiItem[] | RecommendApiItem[], limit?: number) {
  const mappedItems = items
    .filter(
      (item): item is PatternApiItem | RecommendApiItem =>
        typeof item.id === "number" &&
        typeof item.title === "string" &&
        typeof item.author === "string",
    )
    .map((item) => ({
      id: item.id,
      title: item.title,
      author: item.author,
      image: item.thumbnailUrl || PATTERN_FALLBACK_IMAGE,
      isScrapped: "my" in item ? item.my?.scrapped === true : false,
    }));

  return typeof limit === "number" ? mappedItems.slice(0, limit) : mappedItems;
}

export const homeQueryKeys = {
  all: ["home"] as const,
  bestPatternsRoot: ["home", "bestPatterns"] as const,
  bestPatterns: (viewerKey: string) => ["home", "bestPatterns", viewerKey] as const,
  newPatternsRoot: ["home", "newPatterns"] as const,
  newPatterns: (viewerKey: string) => ["home", "newPatterns", viewerKey] as const,
  recommendPatternsRoot: ["home", "recommendPatterns"] as const,
  recommendPatterns: (viewerKey: string) => ["home", "recommendPatterns", viewerKey] as const,
  interestsRoot: ["home", "interests"] as const,
  interests: (viewerKey: string) => ["home", "interests", viewerKey] as const,
};

export async function fetchHomePatterns(
  sort: PatternSort,
  limit: number,
  { signal }: { signal?: AbortSignal } = {},
) {
  const params = new URLSearchParams({
    category: "all",
    sort,
    page: "1",
  });

  const response = await fetchOptionalAuth({
    input: buildApiUrl(`/v1/patterns?${params.toString()}`),
    init: {
      method: "GET",
      signal,
    },
  });

  if (!response.ok) {
    await throwApiError(response, "Failed to load home patterns.");
  }

  const payload = (await response.json()) as PatternListResponse;

  if (payload.error) {
    throwApiPayloadError(payload.error, "Failed to load home patterns.");
  }

  if (!payload.data || !Array.isArray(payload.data.items)) {
    throw createInvalidApiResponseError("Failed to load home patterns.");
  }

  return mapPatternItems(payload.data.items, limit);
}

export async function fetchRecommendedPatterns(
  { signal }: { signal?: AbortSignal } = {},
) {
  const response = await fetchOptionalAuth({
    input: buildApiUrl("/v1/patterns/recommend"),
    init: {
      method: "GET",
      signal,
    },
  });

  if (!response.ok) {
    await throwApiError(response, "Failed to load recommended patterns.");
  }

  const payload = (await response.json()) as RecommendResponse;

  if (payload.error) {
    throwApiPayloadError(payload.error, "Failed to load recommended patterns.");
  }

  if (!payload.data || !Array.isArray(payload.data.items)) {
    throw createInvalidApiResponseError("Failed to load recommended patterns.");
  }

  return mapPatternItems(payload.data.items, MAX_RECOMMENDED_PATTERN_COUNT);
}

export async function fetchUserInterests(
  { signal }: { signal?: AbortSignal } = {},
) {
  const response = await fetchAuthenticated({
    input: buildApiUrl("/v1/users/me/interests"),
    init: {
      method: "GET",
      signal,
    },
  });

  if (!response.ok) {
    await throwApiError(response, "Failed to load user interests.");
  }

  const payload = (await response.json()) as InterestsResponse;

  if (payload.error) {
    throwApiPayloadError(payload.error, "Failed to load user interests.");
  }

  if (!payload.data) {
    throw createInvalidApiResponseError("Failed to load user interests.");
  }

  return Array.isArray(payload.data.keywords) ? payload.data.keywords : [];
}

export async function saveUserInterests(keywords: string[]) {
  const response = await fetchAuthenticated({
    input: buildApiUrl("/v1/users/me/interests"),
    init: {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ keywords }),
    },
  });

  if (!response.ok) {
    await throwApiError(response, "Failed to save user interests.");
  }

  const payload = (await response.json()) as InterestsResponse;

  if (payload.error) {
    throwApiPayloadError(payload.error, "Failed to save user interests.");
  }

  if (!payload.data) {
    throw createInvalidApiResponseError("Failed to save user interests.");
  }

  return Array.isArray(payload.data.keywords) ? payload.data.keywords : [];
}

export function bestPatternsQueryOptions(viewerKey: string) {
  return queryOptions({
    queryKey: homeQueryKeys.bestPatterns(viewerKey),
    queryFn: ({ signal }) => fetchHomePatterns("views", 10, { signal }),
    staleTime: QUERY_STALE_TIME.dynamicList,
  });
}

export function newPatternsQueryOptions(viewerKey: string) {
  return queryOptions({
    queryKey: homeQueryKeys.newPatterns(viewerKey),
    queryFn: ({ signal }) => fetchHomePatterns("news", 10, { signal }),
    staleTime: QUERY_STALE_TIME.dynamicList,
  });
}

export function recommendPatternsQueryOptions(viewerKey: string) {
  return queryOptions({
    queryKey: homeQueryKeys.recommendPatterns(viewerKey),
    queryFn: ({ signal }) => fetchRecommendedPatterns({ signal }),
    staleTime: QUERY_STALE_TIME.personalized,
  });
}

export function userInterestsQueryOptions(viewerKey: string) {
  return queryOptions({
    queryKey: homeQueryKeys.interests(viewerKey),
    queryFn: ({ signal }) => fetchUserInterests({ signal }),
    staleTime: QUERY_STALE_TIME.personalized,
  });
}
