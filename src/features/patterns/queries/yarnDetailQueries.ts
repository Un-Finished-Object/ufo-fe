import { queryOptions } from "@tanstack/react-query";
import { buildApiUrl } from "@/lib/api/client";
import {
  createInvalidApiResponseError,
  throwApiError,
  throwApiPayloadError,
} from "@/lib/api/ApiError";
import { fetchOptionalAuth } from "@/lib/fetch/fetchOptionalAuth";
import { QUERY_STALE_TIME } from "@/lib/query/client";

type YarnDetailResponse = {
  data?: {
    yarnId?: number;
    yarnName?: string;
    weight?: number | null;
    cost?: number | null;
    component?: string | null;
    store?: string | null;
    length?: number | null;
  };
  error?: unknown;
};

export type YarnDetailData = {
  yarnId: number;
  yarnName: string;
  weight: number | null;
  cost: number | null;
  component: string;
  store: string;
  length: number | null;
};

function getSafeText(value?: string | null) {
  const trimmedValue = value?.trim();
  return trimmedValue ? trimmedValue : "";
}

export function yarnDetailQueryKey(yarnId: number) {
  return ["yarnDetail", yarnId] as const;
}

export async function fetchYarnDetail(
  yarnId: number,
  { signal }: { signal?: AbortSignal } = {},
) {
  const response = await fetchOptionalAuth({
    input: buildApiUrl(`/v1/yarns/${yarnId}/`),
    init: {
      method: "GET",
      signal,
    },
  });

  if (!response.ok) {
    await throwApiError(response, "Failed to load yarn detail.");
  }

  const payload = (await response.json()) as YarnDetailResponse;

  if (payload.error) {
    throwApiPayloadError(payload.error, "Failed to load yarn detail.");
  }

  if (
    !payload.data ||
    typeof payload.data.yarnId !== "number" ||
    typeof payload.data.yarnName !== "string"
  ) {
    throw createInvalidApiResponseError("Invalid yarn detail response.");
  }

  return {
    yarnId: payload.data.yarnId,
    yarnName: payload.data.yarnName,
    weight: typeof payload.data.weight === "number" ? payload.data.weight : null,
    cost: typeof payload.data.cost === "number" ? payload.data.cost : null,
    component: getSafeText(payload.data.component),
    store: getSafeText(payload.data.store),
    length: typeof payload.data.length === "number" ? payload.data.length : null,
  } satisfies YarnDetailData;
}

export function yarnDetailQueryOptions(yarnId: number) {
  return queryOptions({
    queryKey: yarnDetailQueryKey(yarnId),
    queryFn: ({ signal }) => fetchYarnDetail(yarnId, { signal }),
    staleTime: QUERY_STALE_TIME.reference,
  });
}
