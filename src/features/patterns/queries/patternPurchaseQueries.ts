import { queryOptions } from "@tanstack/react-query";
import { fetchAuthenticated } from "@/lib/fetch/fetchAuthenticated";
import { buildApiUrl } from "@/lib/api/client";
import { QUERY_STALE_TIME } from "@/lib/query/client";
import {
  createInvalidApiResponseError,
  throwApiError,
  throwApiPayloadError,
} from "@/lib/api/ApiError";

export type PatternPurchaseType = "chat" | "yarn";

export type PatternPurchaseStatus = {
  userId: number | null;
  chat: boolean;
  chatroomId: number | null;
  alternative: boolean;
};

type PatternPurchaseStatusResponse = {
  data?: {
    userId?: number;
    chat?: boolean;
    chatRoomId?: number;
    alternative?: boolean;
  };
  error?: unknown;
};

type PurchasePatternAccessResponse = {
  data?: {
    userId?: number;
    chatRoomId?: number;
    type?: unknown;
  };
  error?: unknown;
};

export function patternPurchaseQueryKey(patternId: number) {
  return ["patternPurchase", patternId] as const;
}

export const patternPurchaseQueryRoot = ["patternPurchase"] as const;

function getChatRoomId(data: { chatRoomId?: number }) {
  return typeof data.chatRoomId === "number" ? data.chatRoomId : null;
}

export async function fetchPatternPurchaseStatus(
  patternId: number,
  { signal }: { signal?: AbortSignal } = {},
) {
  const response = await fetchAuthenticated({
    input: buildApiUrl(`/v1/patterns/${patternId}/purchase`),
    init: {
      method: "GET",
      credentials: "include",
      signal,
    },
  });

  if (!response.ok) {
    await throwApiError(response, "Failed to load pattern purchase status.");
  }

  const payload = (await response.json()) as PatternPurchaseStatusResponse;

  if (payload.error) {
    throwApiPayloadError(payload.error, "Failed to load pattern purchase status.");
  }

  if (!payload.data) {
    throw createInvalidApiResponseError("Failed to load pattern purchase status.");
  }

  return {
    userId: typeof payload.data.userId === "number" ? payload.data.userId : null,
    chat: payload.data.chat === true,
    chatroomId: getChatRoomId(payload.data),
    alternative: payload.data.alternative === true,
  } satisfies PatternPurchaseStatus;
}

export async function purchasePatternAccess({
  patternId,
  type,
}: {
  patternId: number;
  type: PatternPurchaseType;
}) {
  const response = await fetchAuthenticated({
    input: buildApiUrl(`/v1/patterns/${patternId}/purchase`),
    init: {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ type }),
    },
  });

  if (!response.ok) {
    await throwApiError(response, "Failed to purchase pattern access.");
  }

  const payload = (await response.json()) as PurchasePatternAccessResponse;

  if (payload.error) {
    throwApiPayloadError(payload.error, "Failed to purchase pattern access.");
  }

  if (!payload.data) {
    throw createInvalidApiResponseError("Failed to purchase pattern access.");
  }

  return {
    userId: typeof payload.data.userId === "number" ? payload.data.userId : null,
    chatroomId: getChatRoomId(payload.data),
    type,
  } as const;
}

export function patternPurchaseStatusQueryOptions(patternId: number) {
  return queryOptions({
    queryKey: patternPurchaseQueryKey(patternId),
    queryFn: ({ signal }) => fetchPatternPurchaseStatus(patternId, { signal }),
    staleTime: QUERY_STALE_TIME.critical,
  });
}
