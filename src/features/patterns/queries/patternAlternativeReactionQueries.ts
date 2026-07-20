import { queryOptions } from "@tanstack/react-query";
import { buildApiUrl } from "@/lib/api/client";
import {
  createInvalidApiResponseError,
  throwApiError,
  throwApiPayloadError,
} from "@/lib/api/ApiError";
import { fetchAuthenticated } from "@/lib/fetch/fetchAuthenticated";
import { QUERY_STALE_TIME } from "@/lib/query/client";

type AlternativeReactionResponse = {
  data?: {
    altId?: number;
    type?: number;
    likesCount?: number;
    updatedAt?: string;
  };
  error?: unknown;
};

export type AlternativeReaction = {
  altId: number;
  type: 1 | 2;
  likesCount: number;
  updatedAt: string;
};

export const alternativeReactionQueryRoot = ["alternativeReaction"] as const;

export function alternativeReactionQueryKey(altId: number) {
  return [...alternativeReactionQueryRoot, altId] as const;
}

function parseAlternativeReaction(payload: AlternativeReactionResponse) {
  if (payload.error) {
    throwApiPayloadError(payload.error, "Failed to load alternative reaction.");
  }

  const data = payload.data;
  if (
    !data ||
    typeof data.altId !== "number" ||
    (data.type !== 1 && data.type !== 2) ||
    typeof data.likesCount !== "number" ||
    typeof data.updatedAt !== "string"
  ) {
    throw createInvalidApiResponseError("Invalid alternative reaction response.");
  }

  return {
    altId: data.altId,
    type: data.type,
    likesCount: data.likesCount,
    updatedAt: data.updatedAt,
  } satisfies AlternativeReaction;
}

export async function fetchAlternativeReaction(
  altId: number,
  { signal }: { signal?: AbortSignal } = {},
) {
  const response = await fetchAuthenticated({
    input: buildApiUrl(`/v1/alternatives/${altId}/reaction`),
    init: { method: "GET", credentials: "include", signal },
  });

  if (!response.ok) {
    await throwApiError(response, "Failed to load alternative reaction.");
  }

  return parseAlternativeReaction((await response.json()) as AlternativeReactionResponse);
}

export async function updateAlternativeReaction({
  altId,
  type,
}: {
  altId: number;
  type: 1 | 2;
}) {
  const response = await fetchAuthenticated({
    input: buildApiUrl(`/v1/alternatives/${altId}/reaction`),
    init: {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type }),
    },
  });

  if (!response.ok) {
    await throwApiError(response, "Failed to update alternative reaction.");
  }

  return parseAlternativeReaction((await response.json()) as AlternativeReactionResponse);
}

export function alternativeReactionQueryOptions(altId: number) {
  return queryOptions({
    queryKey: alternativeReactionQueryKey(altId),
    queryFn: ({ signal }) => fetchAlternativeReaction(altId, { signal }),
    staleTime: QUERY_STALE_TIME.critical,
  });
}
