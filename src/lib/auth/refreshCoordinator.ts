import {
  applyRefreshedAccessToken,
  getAccessTokenSnapshot,
  invalidateAccessTokenSession,
} from "@/lib/auth/accessToken";
import { requestAccessTokenRefresh } from "@/lib/auth/refreshAccessToken";

const MIN_REFRESH_INTERVAL_MS = 30 * 1000;
const INITIAL_RETRY_DELAY_MS = 30 * 1000;
const MAX_RETRY_DELAY_MS = 5 * 60 * 1000;

export type RefreshReason =
  | "login"
  | "bootstrap"
  | "scheduled"
  | "visibility"
  | "online"
  | "unauthorized"
  | "stomp"
  | "logout"
  | "logout-retry";

export type RefreshCoordinatorResult =
  | { type: "refreshed" | "fresh"; revision: number }
  | { type: "recently-refreshed"; revision: number }
  | { type: "unauthorized" | "stale-session" | "logout-in-progress" }
  | { type: "transient-error"; retryAfterMs: number };

type InFlightRefresh = {
  generation: number;
  promise: Promise<RefreshCoordinatorResult>;
};

let inFlightRefresh: InFlightRefresh | null = null;
let trackedGeneration = -1;
let lastRefreshSuccessAt = 0;
let failureCount = 0;
let nextAttemptAt = 0;

function syncGeneration(generation: number) {
  if (trackedGeneration === generation) {
    return;
  }

  trackedGeneration = generation;
  lastRefreshSuccessAt = 0;
  failureCount = 0;
  nextAttemptAt = 0;
}

function getRetryDelayMs() {
  return Math.min(
    INITIAL_RETRY_DELAY_MS * 2 ** Math.max(0, failureCount - 1),
    MAX_RETRY_DELAY_MS,
  );
}

export function isAccessTokenRefreshDue(
  now = Date.now(),
  snapshot = getAccessTokenSnapshot(),
) {
  return snapshot.refreshAtMs === null || snapshot.refreshAtMs <= now;
}

export async function ensureFreshAccessToken({
  reason,
}: {
  reason: RefreshReason;
}): Promise<RefreshCoordinatorResult> {
  const snapshot = getAccessTokenSnapshot();
  const generation = snapshot.sessionGeneration;
  const now = Date.now();
  const isLogoutReason = reason === "logout" || reason === "logout-retry";
  const bypassRefreshGuards = reason === "login" || reason === "logout-retry";

  syncGeneration(generation);

  if (snapshot.sessionPhase === "logging-out" && !isLogoutReason) {
    return { type: "logout-in-progress" };
  }

  if (snapshot.sessionPhase === "inactive" && reason !== "login") {
    return { type: "unauthorized" };
  }

  if (inFlightRefresh?.generation === generation) {
    return inFlightRefresh.promise;
  }

  if (!bypassRefreshGuards && snapshot.refreshEligibility === "unavailable") {
    return { type: "unauthorized" };
  }

  if (
    reason === "logout" &&
    snapshot.token &&
    snapshot.expiresAtMs !== null &&
    snapshot.expiresAtMs > now
  ) {
    return { type: "fresh", revision: snapshot.revision };
  }

  if (
    !bypassRefreshGuards &&
    reason !== "unauthorized" &&
    snapshot.token &&
    !isAccessTokenRefreshDue(now, snapshot)
  ) {
    return { type: "fresh", revision: snapshot.revision };
  }

  if (
    lastRefreshSuccessAt > 0 &&
    now - lastRefreshSuccessAt < MIN_REFRESH_INTERVAL_MS
  ) {
    if (reason === "unauthorized") {
      return { type: "recently-refreshed", revision: snapshot.revision };
    }

    if (!bypassRefreshGuards) {
      return {
        type: "transient-error",
        retryAfterMs: MIN_REFRESH_INTERVAL_MS - (now - lastRefreshSuccessAt),
      };
    }
  }

  if (!bypassRefreshGuards && now < nextAttemptAt) {
    return { type: "transient-error", retryAfterMs: nextAttemptAt - now };
  }

  const refreshPromise = (async (): Promise<RefreshCoordinatorResult> => {
    const result = await requestAccessTokenRefresh();

    if (getAccessTokenSnapshot().sessionGeneration !== generation) {
      return { type: "stale-session" };
    }

    if (result.type === "success") {
      const didApplyToken = applyRefreshedAccessToken({
        token: result.token,
        expiresInMs: result.expiresInMs,
        expectedGeneration: generation,
      });

      if (!didApplyToken) {
        return { type: "stale-session" };
      }

      lastRefreshSuccessAt = Date.now();
      failureCount = 0;
      nextAttemptAt = 0;

      return {
        type: "refreshed",
        revision: getAccessTokenSnapshot().revision,
      };
    }

    if (result.type === "unauthorized") {
      invalidateAccessTokenSession({ expectedGeneration: generation });
      return { type: "unauthorized" };
    }

    failureCount += 1;
    const retryAfterMs = getRetryDelayMs();
    nextAttemptAt = Date.now() + retryAfterMs;

    return { type: "transient-error", retryAfterMs };
  })();

  const currentRefresh = { generation, promise: refreshPromise };
  inFlightRefresh = currentRefresh;

  try {
    return await refreshPromise;
  } finally {
    if (inFlightRefresh === currentRefresh) {
      inFlightRefresh = null;
    }
  }
}
