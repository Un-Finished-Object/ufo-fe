import { buildApiUrl } from "@/lib/api/client";
import { fetchAuthenticated } from "@/lib/fetch/fetchAuthenticated";
import {
  createInvalidApiResponseError,
  throwApiError,
  throwApiPayloadError,
} from "@/lib/api/ApiError";

type PatternScrapItem = {
  id: number;
  title: string;
  author: string;
  image: string;
  isScrapped: boolean;
};

type PatternScrapResult = {
  items: PatternScrapItem[];
  page: number;
  nextPage: number;
};

type PatternScrapApiItem = {
  id?: number;
  title?: string;
  thumbnailUrl?: string | null;
  category?: string;
  subCategory?: string;
  author?: string;
  stats?: {
    views?: number;
    scraps?: number;
  };
  my?: {
    scrapped?: boolean;
  };
  createdAt?: string;
};

type PatternScrapResponse = {
  data?: {
    items?: PatternScrapApiItem[];
    page?: number;
    nextPage?: number;
  };
  error?: unknown;
};

const PATTERN_SCRAPS_ENDPOINT = "/v1/users/me/scraps";
const PATTERN_FALLBACK_IMAGE = "/image/UFO.svg";

export async function fetchPatternScraps({
  page,
  signal,
}: {
  page: number;
  signal?: AbortSignal;
}): Promise<PatternScrapResult> {
  const params = new URLSearchParams({
    page: String(page),
  });
  const response = await fetchAuthenticated({
    input: buildApiUrl(`${PATTERN_SCRAPS_ENDPOINT}?${params.toString()}`),
    init: {
      method: "GET",
      signal,
      credentials: "include",
    },
  });

  if (!response.ok) {
    await throwApiError(response, "Failed to load pattern scraps.");
  }

  const payload = (await response.json()) as PatternScrapResponse;

  if (payload.error) {
    throwApiPayloadError(payload.error, "Failed to load pattern scraps.");
  }

  if (!payload.data || !Array.isArray(payload.data.items)) {
    throw createInvalidApiResponseError("Failed to load pattern scraps.");
  }

  return {
    items: payload.data.items
      .filter(
        (item): item is PatternScrapApiItem & { id: number; title: string; author: string } =>
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
    page: typeof payload.data.page === "number" ? payload.data.page : page,
    nextPage: typeof payload.data.nextPage === "number" ? payload.data.nextPage : 0,
  };
}

export type { PatternScrapItem, PatternScrapResult };
