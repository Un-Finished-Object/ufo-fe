import { queryOptions } from "@tanstack/react-query";
import { buildApiUrl } from "@/lib/api/client";
import {
  createInvalidApiResponseError,
  throwApiError,
  throwApiPayloadError,
} from "@/lib/api/ApiError";
import { fetchPublic } from "@/lib/fetch/fetchPublic";
import { QUERY_STALE_TIME } from "@/lib/query/client";

type CreditRuleApiItem = {
  key?: string;
  amount?: number;
  description?: string;
  dailyLimitExempt?: boolean;
};

type CreditRulesPayload = {
  dailyMaxEarnCredits?: number;
  earnRules?: CreditRuleApiItem[];
  spendRules?: CreditRuleApiItem[];
};

type CreditRulesResponse = {
  data?: CreditRulesPayload;
  error?: unknown;
};

export type CreditRuleItem = {
  key: string;
  amount: number;
  description: string;
  dailyLimitExempt: boolean;
};

export type CreditRulesResult = {
  dailyMaxEarnCredits: number;
  earnRules: CreditRuleItem[];
  spendRules: CreditRuleItem[];
};

export const creditRuleQueryKeys = {
  all: ["creditRules"] as const,
};

function mapCreditRuleItem(item: CreditRuleApiItem) {
  if (
    typeof item.key !== "string" ||
    typeof item.amount !== "number" ||
    typeof item.description !== "string"
  ) {
    return null;
  }

  return {
    key: item.key,
    amount: item.amount,
    description: item.description,
    dailyLimitExempt: item.dailyLimitExempt === true,
  } satisfies CreditRuleItem;
}

export async function fetchCreditRules({ signal }: { signal?: AbortSignal } = {}) {
  const response = await fetchPublic({
    input: buildApiUrl("/v1/credits/rules"),
    init: {
      method: "GET",
      signal,
    },
  });

  if (!response.ok) {
    await throwApiError(response, "Failed to load credit rules.");
  }

  const payload = (await response.json()) as CreditRulesResponse;

  if (payload.error) {
    throwApiPayloadError(payload.error, "Failed to load credit rules.");
  }

  if (!payload.data || typeof payload.data.dailyMaxEarnCredits !== "number") {
    throw createInvalidApiResponseError("Failed to load credit rules.");
  }

  const earnRules = Array.isArray(payload.data.earnRules) ? payload.data.earnRules : [];
  const spendRules = Array.isArray(payload.data.spendRules) ? payload.data.spendRules : [];

  return {
    dailyMaxEarnCredits: payload.data.dailyMaxEarnCredits,
    earnRules: earnRules
      .map(mapCreditRuleItem)
      .filter((item): item is CreditRuleItem => item !== null),
    spendRules: spendRules
      .map(mapCreditRuleItem)
      .filter((item): item is CreditRuleItem => item !== null),
  } satisfies CreditRulesResult;
}

export function creditRulesQueryOptions() {
  return queryOptions({
    queryKey: creditRuleQueryKeys.all,
    queryFn: ({ signal }) => fetchCreditRules({ signal }),
    staleTime: QUERY_STALE_TIME.reference,
  });
}
