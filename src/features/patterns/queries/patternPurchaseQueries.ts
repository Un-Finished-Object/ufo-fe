import { queryOptions } from "@tanstack/react-query";
import { fetchWithAuthRetry } from "@/lib/fetch/fetchWithAuthRetry";
import { buildApiUrl } from "@/lib/api/client";
import { QUERY_STALE_TIME_MS } from "@/lib/query/client";

export type PatternPurchaseType = "chat" | "yarn";

export type PatternPurchaseStatus = {
  userId: number | null;
  chat: boolean;
  alternative: boolean;
};

type PatternPurchaseStatusResponse = {
  data?: {
    userId?: number;
    chat?: boolean;
    alternative?: boolean;
  };
  error?: unknown;
};

type PurchasePatternAccessResponse = {
  data?: {
    userId?: number;
    type?: unknown;
  };
  error?: unknown;
};

export function patternPurchaseQueryKey(patternId: number) {
  return ["patternPurchase", patternId] as const;
}

export async function fetchPatternPurchaseStatus(
  patternId: number,
  { signal }: { signal?: AbortSignal } = {},
) {
  const response = await fetchWithAuthRetry({
    input: buildApiUrl(`/v1/patterns/${patternId}/purchase`),
    init: {
      method: "GET",
      credentials: "include",
      signal,
    },
  });

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Failed to load pattern purchase status.");
  }

  const payload = (await response.json()) as PatternPurchaseStatusResponse;

  if (payload.error || !payload.data) {
    throw new Error("Failed to load pattern purchase status.");
  }

  return {
    userId: typeof payload.data.userId === "number" ? payload.data.userId : null,
    chat: payload.data.chat === true,
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
  const response = await fetchWithAuthRetry({
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

  if (response.status === 401) {
    throw new Error("Unauthorized");
  }

  if (!response.ok) {
    throw new Error("Failed to purchase pattern access.");
  }

  const payload = (await response.json()) as PurchasePatternAccessResponse;

  if (payload.error || !payload.data) {
    throw new Error("Failed to purchase pattern access.");
  }

  return {
    userId: typeof payload.data.userId === "number" ? payload.data.userId : null,
    type,
  } as const;
}

export function patternPurchaseStatusQueryOptions(patternId: number) {
  return queryOptions({
    queryKey: patternPurchaseQueryKey(patternId),
    queryFn: ({ signal }) => fetchPatternPurchaseStatus(patternId, { signal }),
    staleTime: QUERY_STALE_TIME_MS,
  });
}
