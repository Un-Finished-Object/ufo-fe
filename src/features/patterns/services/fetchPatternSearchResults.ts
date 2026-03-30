import { fetchWithAuthRetry } from "@/lib/fetch/fetchWithAuthRetry";
import { buildApiUrl } from "@/lib/api/client";

type PatternSearchApiItem = {
  id: number;
  title: string;
  thumbnailUrl: string | null;
  author: string;
  my?: {
    scrapped?: boolean;
  };
};

type PatternSearchResponse = {
  data?: {
    items?: PatternSearchApiItem[];
    totalPages?: number;
    page?: number;
  };
  error?: unknown;
};

export type PatternSearchItem = {
  id: number;
  title: string;
  author: string;
  image: string;
  isScrapped: boolean;
};

export type PatternSearchResult = {
  items: PatternSearchItem[];
  page: number;
  totalPages: number;
};

const PATTERN_FALLBACK_IMAGE = "/image/UFO.svg";

export async function fetchPatternSearchResults({
  keyword,
  page,
  signal,
}: {
  keyword: string;
  page: number;
  signal?: AbortSignal;
}): Promise<PatternSearchResult> {
  const trimmedKeyword = keyword.trim();

  if (!trimmedKeyword) {
    return {
      items: [],
      page: 1,
      totalPages: 1,
    };
  }

  const params = new URLSearchParams({
    keyword: trimmedKeyword,
    page: String(page),
  });
  const response = await fetchWithAuthRetry({
    input: buildApiUrl(`/v1/patterns/search?${params.toString()}`),
    init: {
      method: "GET",
      signal,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to load search results.");
  }

  const payload = (await response.json()) as PatternSearchResponse;

  if (payload.error || !payload.data) {
    throw new Error("Failed to load search results.");
  }

  return {
    items: (payload.data.items ?? [])
      .filter(
        (item): item is PatternSearchApiItem =>
          typeof item.id === "number" &&
          typeof item.title === "string" &&
          typeof item.author === "string",
      )
      .map((item) => ({
        id: item.id,
        title: item.title,
        author: item.author,
        image: item.thumbnailUrl || PATTERN_FALLBACK_IMAGE,
        isScrapped: item.my?.scrapped === true,
      })),
    page: typeof payload.data.page === "number" ? payload.data.page : page,
    totalPages: typeof payload.data.totalPages === "number" ? payload.data.totalPages : 1,
  };
}
