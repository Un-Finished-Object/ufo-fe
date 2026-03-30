import { queryOptions } from "@tanstack/react-query";
import { fetchWithAuthRetry } from "@/lib/fetch/fetchWithAuthRetry";
import { buildApiUrl } from "@/lib/api/client";
import { QUERY_STALE_TIME_MS } from "@/lib/query/client";

export type UserProfile = {
  userId: string | null;
  email: string;
  nickname: string;
  profileImage: string;
};

type MeResponse = {
  data?: {
    userId?: number;
    user_id?: number;
    id?: number;
    email?: string;
    nickname?: string;
    profileImage?: string;
    profileImageUrl?: string;
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
  const response = await fetchWithAuthRetry({
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
    throw new Error("Failed to load user information.");
  }

  const payload = (await response.json()) as MeResponse;

  if (payload.error || !payload.data) {
    throw new Error("Failed to load user information.");
  }

  return {
    userId:
      typeof payload.data.userId === "number"
        ? String(payload.data.userId)
        : typeof payload.data.user_id === "number"
          ? String(payload.data.user_id)
          : typeof payload.data.id === "number"
            ? String(payload.data.id)
            : null,
    email: payload.data.email ?? "",
    nickname: payload.data.nickname ?? "",
    profileImage: payload.data.profileImage ?? payload.data.profileImageUrl ?? "",
  } satisfies UserProfile;
}

export async function fetchWallet({ signal }: { signal?: AbortSignal } = {}) {
  const response = await fetchWithAuthRetry({
    input: buildApiUrl("/v1/credits/wallet"),
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
    throw new Error("Failed to load credit balance.");
  }

  const payload = (await response.json()) as WalletResponse;

  if (payload.error || !payload.data || typeof payload.data.balance !== "number") {
    throw new Error("Failed to load credit balance.");
  }

  return payload.data.balance;
}

export function meQueryOptions() {
  return queryOptions({
    queryKey: userQueryKeys.me,
    queryFn: ({ signal }) => fetchMe({ signal }),
    staleTime: QUERY_STALE_TIME_MS,
  });
}

export function walletQueryOptions() {
  return queryOptions({
    queryKey: userQueryKeys.wallet,
    queryFn: ({ signal }) => fetchWallet({ signal }),
    staleTime: QUERY_STALE_TIME_MS,
  });
}
