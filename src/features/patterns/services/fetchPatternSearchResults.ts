import { fetchOptionalAuth } from "@/lib/fetch/fetchOptionalAuth";
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
    nextPage?: number;
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
  nextPage: number;
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
      nextPage: 0,
    };
  }

  const params = new URLSearchParams({
    keyword: trimmedKeyword,
    page: String(page),
  });
  const response = await fetchOptionalAuth({
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

  const resolvedPage = typeof payload.data.page === "number" ? payload.data.page : page;

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
    page: resolvedPage,
    nextPage:
      typeof payload.data.nextPage === "number"
        ? payload.data.nextPage
        : Math.max((payload.data.totalPages ?? resolvedPage) - resolvedPage, 0),
  };
}
