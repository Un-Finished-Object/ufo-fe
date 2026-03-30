import { queryOptions } from "@tanstack/react-query";
import { fetchWithAuthRetry } from "@/lib/fetch/fetchWithAuthRetry";
import { QUERY_STALE_TIME_MS } from "@/lib/query/client";

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

function getApiBase() {
  return process.env.NEXT_PUBLIC_API_BASE ?? "/api";
}

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
  bestPatterns: ["home", "bestPatterns"] as const,
  newPatterns: ["home", "newPatterns"] as const,
  recommendPatterns: (viewerKey: string) => ["home", "recommendPatterns", viewerKey] as const,
  interests: (viewerKey: string) => ["home", "interests", viewerKey] as const,
};

export async function fetchHomePatterns(
  sort: PatternSort,
  limit: number,
  { signal }: { signal?: AbortSignal } = {},
) {
  const apiBase = getApiBase();

  try {
    const params = new URLSearchParams({
      category: "all",
      sort,
      page: "1",
    });

    const response = await fetchWithAuthRetry({
      apiBase,
      input: `${apiBase}/v1/patterns?${params.toString()}`,
      init: {
        method: "GET",
        signal,
      },
    });

    if (!response.ok) {
      return [];
    }

    const payload = (await response.json()) as PatternListResponse;

    if (payload.error || !payload.data || !Array.isArray(payload.data.items)) {
      return [];
    }

    return mapPatternItems(payload.data.items, limit);
  } catch {
    return [];
  }
}

export async function fetchRecommendedPatterns(
  { signal }: { signal?: AbortSignal } = {},
) {
  const apiBase = getApiBase();

  try {
    const response = await fetchWithAuthRetry({
      apiBase,
      input: `${apiBase}/v1/patterns/recommend`,
      init: {
        method: "GET",
        signal,
      },
    });

    if (!response.ok) {
      return [];
    }

    const payload = (await response.json()) as RecommendResponse;

    if (payload.error || !payload.data || !Array.isArray(payload.data.items)) {
      return [];
    }

    return mapPatternItems(payload.data.items);
  } catch {
    return [];
  }
}

export async function fetchUserInterests(
  { signal }: { signal?: AbortSignal } = {},
) {
  const apiBase = getApiBase();

  try {
    const response = await fetchWithAuthRetry({
      apiBase,
      input: `${apiBase}/v1/users/me/interests`,
      init: {
        method: "GET",
        signal,
      },
    });

    if (!response.ok) {
      return [];
    }

    const payload = (await response.json()) as InterestsResponse;

    if (payload.error || !payload.data) {
      return [];
    }

    return Array.isArray(payload.data.keywords) ? payload.data.keywords : [];
  } catch {
    return [];
  }
}

export async function saveUserInterests(keywords: string[]) {
  const apiBase = getApiBase();
  const response = await fetchWithAuthRetry({
    apiBase,
    input: `${apiBase}/v1/users/me/interests`,
    init: {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ keywords }),
    },
  });

  if (!response.ok) {
    throw new Error("Failed to save user interests.");
  }

  const payload = (await response.json()) as InterestsResponse;

  if (payload.error || !payload.data) {
    throw new Error("Failed to save user interests.");
  }

  return Array.isArray(payload.data.keywords) ? payload.data.keywords : [];
}

export function bestPatternsQueryOptions() {
  return queryOptions({
    queryKey: homeQueryKeys.bestPatterns,
    queryFn: ({ signal }) => fetchHomePatterns("views", 5, { signal }),
    staleTime: QUERY_STALE_TIME_MS,
  });
}

export function newPatternsQueryOptions() {
  return queryOptions({
    queryKey: homeQueryKeys.newPatterns,
    queryFn: ({ signal }) => fetchHomePatterns("news", 10, { signal }),
    staleTime: QUERY_STALE_TIME_MS,
  });
}

export function recommendPatternsQueryOptions(viewerKey: string) {
  return queryOptions({
    queryKey: homeQueryKeys.recommendPatterns(viewerKey),
    queryFn: ({ signal }) => fetchRecommendedPatterns({ signal }),
    staleTime: QUERY_STALE_TIME_MS,
  });
}

export function userInterestsQueryOptions(viewerKey: string) {
  return queryOptions({
    queryKey: homeQueryKeys.interests(viewerKey),
    queryFn: ({ signal }) => fetchUserInterests({ signal }),
    staleTime: QUERY_STALE_TIME_MS,
  });
}
