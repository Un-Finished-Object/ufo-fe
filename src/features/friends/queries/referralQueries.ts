import { queryOptions } from "@tanstack/react-query";
import { buildApiUrl } from "@/lib/api/client";
import {
  createInvalidApiResponseError,
  throwApiError,
  throwApiPayloadError,
} from "@/lib/api/ApiError";
import { fetchAuthenticated } from "@/lib/fetch/fetchAuthenticated";
import { QUERY_STALE_TIME } from "@/lib/query/client";

type ReferralResponse = {
  data?: {
    username?: string;
    referralCode?: string;
  };
  error?: unknown;
};

type ValidateReferralResponse = {
  data?: {
    valid?: boolean;
  };
  error?: unknown;
};

export const referralQueryKeys = {
  detail: ["referral"] as const,
};

export async function fetchReferral({ signal }: { signal?: AbortSignal } = {}) {
  const response = await fetchAuthenticated({
    input: buildApiUrl("/v1/referral"),
    init: {
      method: "GET",
      signal,
    },
  });

  if (!response.ok) {
    await throwApiError(response, "Failed to load referral code.");
  }

  const payload = (await response.json()) as ReferralResponse;

  if (payload.error) {
    throwApiPayloadError(payload.error, "Failed to load referral code.");
  }

  if (
    !payload.data ||
    typeof payload.data.username !== "string" ||
    !/^[A-Z0-9]{9}$/.test(payload.data.referralCode ?? "")
  ) {
    throw createInvalidApiResponseError("Failed to load referral code.");
  }

  return {
    username: payload.data.username,
    referralCode: payload.data.referralCode as string,
  };
}

export async function validateReferralCode(referralCode: string) {
  const response = await fetchAuthenticated({
    input: buildApiUrl("/v1/referral"),
    init: {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ referralCode }),
    },
  });

  if (!response.ok) {
    await throwApiError(response, "Failed to validate referral code.");
  }

  const payload = (await response.json()) as ValidateReferralResponse;

  if (payload.error) {
    throwApiPayloadError(payload.error, "Failed to validate referral code.");
  }

  if (!payload.data || typeof payload.data.valid !== "boolean") {
    throw createInvalidApiResponseError("Failed to validate referral code.");
  }

  return payload.data.valid;
}

export function referralQueryOptions() {
  return queryOptions({
    queryKey: referralQueryKeys.detail,
    queryFn: ({ signal }) => fetchReferral({ signal }),
    staleTime: QUERY_STALE_TIME.userState,
  });
}
