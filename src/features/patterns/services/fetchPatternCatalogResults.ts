import { fetchOptionalAuth } from "@/lib/fetch/fetchOptionalAuth";
import { buildApiUrl } from "@/lib/api/client";

type PatternCatalogApiItem = {
  id: number;
  title: string;
  thumbnailUrl: string | null;
  author: string;
  my?: {
    scrapped?: boolean;
  };
};

type PatternCatalogResponse = {
  data?: {
    items?: PatternCatalogApiItem[];
    nextPage?: number;
    totalPages?: number;
    page?: number;
  };
  error?: unknown;
};

export type PatternCatalogItem = {
  id: number;
  title: string;
  author: string;
  image: string;
  isScrapped: boolean;
};

export type PatternCatalogResult = {
  items: PatternCatalogItem[];
  page: number;
  nextPage: number;
};

const PATTERN_FALLBACK_IMAGE = "/image/UFO.svg";

export async function fetchPatternCatalogResults({
  category,
  sort,
  page,
  subCategory,
  signal,
}: {
  category: string;
  sort: string;
  page: number;
  subCategory?: string;
  signal?: AbortSignal;
}): Promise<PatternCatalogResult> {
  const params = new URLSearchParams({
    category,
    sort,
    page: String(page),
  });

  if (subCategory) {
    params.set("subCategory", subCategory);
  }

  const response = await fetchOptionalAuth({
    input: buildApiUrl(`/v1/patterns?${params.toString()}`),
    init: {
      method: "GET",
      signal,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to load pattern catalog.");
  }

  const payload = (await response.json()) as PatternCatalogResponse;

  if (payload.error || !payload.data) {
    throw new Error("Failed to load pattern catalog.");
  }

  const resolvedPage = typeof payload.data.page === "number" ? payload.data.page : page;

  return {
    items: (payload.data.items ?? [])
      .filter(
        (item): item is PatternCatalogApiItem =>
          typeof item.id === "number" &&
          typeof item.title === "string" &&
          typeof item.author === "string",
      )
      .map((item) => ({
        id: item.id,
        title: item.title,
        author: item.author,
        image: item.thumbnailUrl ?? PATTERN_FALLBACK_IMAGE,
        isScrapped: item.my?.scrapped === true,
      })),
    page: resolvedPage,
    nextPage:
      typeof payload.data.nextPage === "number"
        ? payload.data.nextPage
        : Math.max((payload.data.totalPages ?? resolvedPage) - resolvedPage, 0),
  };
}
