import { queryOptions } from "@tanstack/react-query";
import { buildApiUrl } from "@/lib/api/client";
import {
  createInvalidApiResponseError,
  throwApiError,
  throwApiPayloadError,
} from "@/lib/api/ApiError";
import { fetchAuthenticated } from "@/lib/fetch/fetchAuthenticated";
import { QUERY_STALE_TIME } from "@/lib/query/client";

export type CreditTransactionTypeFilter = "all" | "earn" | "spend";
export type CreditTransactionReasonFilter =
  | "all"
  | "signup_bonus"
  | "attendance_daily"
  | "referral_bonus"
  | "chatroom_entry"
  | "alt_yarn_view";

type CreditTransactionApiItem = {
  id?: string;
  type?: string;
  amount?: number;
  balanceAfter?: number;
  reason?: string;
  createdAt?: string;
};

type CreditTransactionsPayload = {
  items?: CreditTransactionApiItem[];
  page?: number;
  nextPage?: number;
};

type CreditTransactionsResponse = {
  data?: CreditTransactionsPayload;
  error?: unknown;
};

export type CreditTransactionItem = {
  id: string;
  type: string;
  amount: number;
  balanceAfter: number;
  reason: string;
  createdAt: string;
};

export type CreditTransactionsResult = {
  items: CreditTransactionItem[];
  page: number;
  nextPage: number;
};

export type CreditTransactionsQueryParams = {
  page: number;
  type: CreditTransactionTypeFilter;
  reason: CreditTransactionReasonFilter;
};

export const creditTransactionQueryKeys = {
  all: ["creditTransactions"] as const,
  list: (params: CreditTransactionsQueryParams) =>
    ["creditTransactions", params.page, params.type, params.reason] as const,
};

function mapCreditTransactionItem(item: CreditTransactionApiItem) {
  if (
    typeof item.id !== "string" ||
    typeof item.type !== "string" ||
    typeof item.amount !== "number" ||
    typeof item.balanceAfter !== "number" ||
    typeof item.reason !== "string" ||
    typeof item.createdAt !== "string"
  ) {
    return null;
  }

  return {
    id: item.id,
    type: item.type,
    amount: item.amount,
    balanceAfter: item.balanceAfter,
    reason: item.reason,
    createdAt: item.createdAt,
  } satisfies CreditTransactionItem;
}

export async function fetchCreditTransactions(
  params: CreditTransactionsQueryParams,
  { signal }: { signal?: AbortSignal } = {},
) {
  const searchParams = new URLSearchParams({
    page: String(params.page),
  });

  if (params.type !== "all") {
    searchParams.set("type", params.type);
  }

  if (params.reason !== "all") {
    searchParams.set("reason", params.reason);
  }

  const response = await fetchAuthenticated({
    input: buildApiUrl(`/v1/credits/transactions?${searchParams.toString()}`),
    init: {
      method: "GET",
      credentials: "include",
      signal,
    },
  });

  if (!response.ok) {
    await throwApiError(response, "Failed to load credit transactions.");
  }

  const payload = (await response.json()) as CreditTransactionsResponse;

  if (payload.error) {
    throwApiPayloadError(payload.error, "Failed to load credit transactions.");
  }

  if (!payload.data || typeof payload.data.page !== "number") {
    throw createInvalidApiResponseError("Failed to load credit transactions.");
  }

  const items = Array.isArray(payload.data.items) ? payload.data.items : [];
  const mappedItems = items
    .map(mapCreditTransactionItem)
    .filter((item): item is CreditTransactionItem => item !== null);

  return {
    items: mappedItems,
    page: payload.data.page,
    nextPage:
      typeof payload.data.nextPage === "number"
        ? Math.min(5, Math.max(0, payload.data.nextPage))
        : 0,
  } satisfies CreditTransactionsResult;
}

export function creditTransactionsQueryOptions(
  params: CreditTransactionsQueryParams,
  { enabled = true }: { enabled?: boolean } = {},
) {
  return queryOptions({
    queryKey: creditTransactionQueryKeys.list(params),
    enabled,
    queryFn: ({ signal }) => fetchCreditTransactions(params, { signal }),
    staleTime: QUERY_STALE_TIME.userState,
  });
}
