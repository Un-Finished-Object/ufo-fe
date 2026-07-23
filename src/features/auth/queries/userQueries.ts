import { queryOptions } from "@tanstack/react-query";
import { fetchAuthenticated } from "@/lib/fetch/fetchAuthenticated";
import { buildApiUrl } from "@/lib/api/client";
import {
  createInvalidApiResponseError,
  throwApiError,
  throwApiPayloadError,
} from "@/lib/api/ApiError";
import { getAccessToken } from "@/lib/auth/accessToken";
import { refreshAccessToken } from "@/lib/auth/refreshAccessToken";
import { QUERY_STALE_TIME } from "@/lib/query/client";

export type UserProfile = {
  userId: string;
  email: string;
  nickname: string;
  profileImage: string;
  joinDate: number | null;
  role: "USER" | "ADMIN" | null;
};

type MeResponse = {
  data?: {
    userId?: number;
    email?: string;
    nickname?: string;
    profileImage?: string;
    profileImageUrl?: string;
    joinDate?: number | string;
    role?: string;
  };
  error?: unknown;
};

type WalletResponse = {
  data?: {
    balance?: number;
  };
  error?: unknown;
};

export const userQueryKeys = {
  me: ["me"] as const,
  wallet: ["wallet"] as const,
};

export async function fetchMe({ signal }: { signal?: AbortSignal } = {}) {
  if (!getAccessToken()) {
    const refreshResponse = await refreshAccessToken({ mode: "auto" });

    if (!refreshResponse.ok) {
      return null;
    }
  }

  const response = await fetchAuthenticated({
    input: buildApiUrl("/v1/users/me"),
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
    await throwApiError(response, "Failed to load user information.");
  }

  const payload = (await response.json()) as MeResponse;

  if (payload.error) {
    throwApiPayloadError(payload.error, "Failed to load user information.");
  }

  if (!payload.data) {
    throw createInvalidApiResponseError("Failed to load user information.");
  }

  if (typeof payload.data.userId !== "number") {
    throw createInvalidApiResponseError("Failed to load user information.");
  }

  const joinDate =
    typeof payload.data.joinDate === "number"
      ? payload.data.joinDate
      : typeof payload.data.joinDate === "string"
        ? Number(payload.data.joinDate)
        : null;

  return {
    userId: String(payload.data.userId),
    email: payload.data.email ?? "",
    nickname: payload.data.nickname ?? "",
    profileImage: payload.data.profileImage ?? payload.data.profileImageUrl ?? "",
    joinDate: Number.isFinite(joinDate) ? joinDate : null,
    role:
      payload.data.role === "ADMIN" || payload.data.role === "USER"
        ? payload.data.role
        : null,
  } satisfies UserProfile;
}

export async function fetchWallet({ signal }: { signal?: AbortSignal } = {}) {
  const response = await fetchAuthenticated({
    input: buildApiUrl("/v1/credits/wallet"),
    init: {
      method: "GET",
      credentials: "include",
      signal,
    },
  });

  if (!response.ok) {
    await throwApiError(response, "Failed to load credit balance.");
  }

  const payload = (await response.json()) as WalletResponse;

  if (payload.error) {
    throwApiPayloadError(payload.error, "Failed to load credit balance.");
  }

  if (!payload.data || typeof payload.data.balance !== "number") {
    throw createInvalidApiResponseError("Failed to load credit balance.");
  }

  return payload.data.balance;
}

export function meQueryOptions() {
  return queryOptions({
    queryKey: userQueryKeys.me,
    queryFn: ({ signal }) => fetchMe({ signal }),
    staleTime: QUERY_STALE_TIME.userState,
  });
}

export function walletQueryOptions() {
  return queryOptions({
    queryKey: userQueryKeys.wallet,
    queryFn: ({ signal }) => fetchWallet({ signal }),
    staleTime: QUERY_STALE_TIME.critical,
  });
}
