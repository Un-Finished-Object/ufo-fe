import { queryOptions } from "@tanstack/react-query";
import { buildApiUrl } from "@/lib/api/client";
import { fetchAuthenticated } from "@/lib/fetch/fetchAuthenticated";
import {
  createInvalidApiResponseError,
  throwApiError,
  throwApiPayloadError,
} from "@/lib/api/ApiError";
import { QUERY_STALE_TIME } from "@/lib/query/client";

type PurchasedProjectApiItem = {
  patternId?: number;
  patternName?: string;
  thumbnailUrl?: string | null;
  author?: string;
  purchaseYarn?: boolean;
  purchaseYarnDate?: string;
  purchaseChat?: boolean;
  purchaseChatId?: number;
  purchaseChatDate?: string;
};

type PurchasedProjectsPayload = {
  projects?: PurchasedProjectApiItem[];
  nextPage?: number;
};

type PurchasedProjectsResponse = {
  data?: PurchasedProjectsPayload;
  error?: unknown;
};

export type PurchasedProjectItem = {
  patternId: number;
  title: string;
  image: string;
  authorName: string;
  purchaseYarnDate: string | null;
  purchaseChatDate: string | null;
  purchaseChatId: number | null;
  chat: boolean;
  alternative: boolean;
};

export type PurchasedProjectsResult = {
  items: PurchasedProjectItem[];
  page: number;
  nextPage: number;
};

const PATTERN_FALLBACK_IMAGE = "/image/UFO.svg";

function getSafeText(value?: string | null) {
  const trimmedValue = value?.trim();
  return trimmedValue ? trimmedValue : "-";
}

function mapPurchasedProjectItem(item: PurchasedProjectApiItem) {
  if (typeof item.patternId !== "number" || typeof item.patternName !== "string") {
    return null;
  }

  return {
    patternId: item.patternId,
    title: getSafeText(item.patternName),
    image: item.thumbnailUrl ?? PATTERN_FALLBACK_IMAGE,
    authorName: getSafeText(item.author),
    purchaseYarnDate: typeof item.purchaseYarnDate === "string" ? item.purchaseYarnDate : null,
    purchaseChatDate: typeof item.purchaseChatDate === "string" ? item.purchaseChatDate : null,
    purchaseChatId: typeof item.purchaseChatId === "number" ? item.purchaseChatId : null,
    chat: item.purchaseChat === true,
    alternative: item.purchaseYarn === true,
  } satisfies PurchasedProjectItem;
}

export const myActivityQueryKeys = {
  all: ["myActivity"] as const,
  purchasedProjects: ["myActivity", "purchasedProjects"] as const,
  purchasedProjectsPage: (page: number) =>
    ["myActivity", "purchasedProjects", page] as const,
};

export async function fetchMyPurchasedProjects(
  page: number,
  { signal }: { signal?: AbortSignal } = {},
) {
  const params = new URLSearchParams({
    page: String(page),
  });

  const response = await fetchAuthenticated({
    input: buildApiUrl(`/v1/users/me/projects?${params.toString()}`),
    init: {
      method: "GET",
      credentials: "include",
      signal,
    },
  });

  if (!response.ok) {
    await throwApiError(response, "Failed to load purchased projects.");
  }

  const payload = (await response.json()) as PurchasedProjectsResponse;

  if (payload.error) {
    throwApiPayloadError(payload.error, "Failed to load purchased projects.");
  }

  if (!payload.data) {
    throw createInvalidApiResponseError("Failed to load purchased projects.");
  }

  const items = Array.isArray(payload.data.projects) ? payload.data.projects : [];
  const nextPage =
    typeof payload.data.nextPage === "number"
      ? Math.min(5, Math.max(0, payload.data.nextPage))
      : 0;

  return {
    items: items
      .map(mapPurchasedProjectItem)
      .filter((item): item is PurchasedProjectItem => item !== null),
    page,
    nextPage,
  } satisfies PurchasedProjectsResult;
}

export function myPurchasedProjectsQueryOptions(
  page: number,
  { enabled = true }: { enabled?: boolean } = {},
) {
  return queryOptions({
    queryKey: myActivityQueryKeys.purchasedProjectsPage(page),
    enabled,
    queryFn: ({ signal }) => fetchMyPurchasedProjects(page, { signal }),
    staleTime: QUERY_STALE_TIME.userState,
  });
}
