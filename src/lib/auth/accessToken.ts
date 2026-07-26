export type RefreshEligibility = "unknown" | "available" | "unavailable";
export type AccessTokenSessionPhase = "active" | "logging-out" | "inactive";

export type AccessTokenSnapshot = {
  token: string | null;
  expiresAtMs: number | null;
  refreshAtMs: number | null;
  revision: number;
  sessionGeneration: number;
  refreshEligibility: RefreshEligibility;
  sessionPhase: AccessTokenSessionPhase;
};

const MAX_REFRESH_LEAD_MS = 60 * 1000;
const MIN_REFRESH_LEAD_MS = 5 * 1000;
const MIN_SCHEDULE_DELAY_MS = 1000;

const initialAccessTokenSnapshot: AccessTokenSnapshot = {
  token: null,
  expiresAtMs: null,
  refreshAtMs: null,
  revision: 0,
  sessionGeneration: 0,
  refreshEligibility: "unknown",
  sessionPhase: "active",
};

let accessTokenSnapshot = initialAccessTokenSnapshot;
const accessTokenListeners = new Set<() => void>();

function notifyAccessTokenListeners() {
  accessTokenListeners.forEach((listener) => {
    listener();
  });
}

function updateAccessTokenSnapshot(nextSnapshot: AccessTokenSnapshot) {
  accessTokenSnapshot = nextSnapshot;
  notifyAccessTokenListeners();
}

export function getAccessTokenSnapshot() {
  return accessTokenSnapshot;
}

export function getInitialAccessTokenSnapshot() {
  return initialAccessTokenSnapshot;
}

export function getAccessToken() {
  return accessTokenSnapshot.token;
}

export function applyRefreshedAccessToken({
  token,
  expiresInMs,
  expectedGeneration,
}: {
  token: string;
  expiresInMs: number;
  expectedGeneration: number;
}) {
  if (accessTokenSnapshot.sessionGeneration !== expectedGeneration) {
    return false;
  }

  const normalizedToken = token.trim();

  if (!normalizedToken || !Number.isSafeInteger(expiresInMs) || expiresInMs <= 0) {
    return false;
  }

  const now = Date.now();
  const refreshLeadMs = Math.min(
    MAX_REFRESH_LEAD_MS,
    Math.max(MIN_REFRESH_LEAD_MS, Math.floor(expiresInMs * 0.1)),
  );
  const refreshDelayMs = Math.max(
    MIN_SCHEDULE_DELAY_MS,
    expiresInMs - refreshLeadMs,
  );

  updateAccessTokenSnapshot({
    token: normalizedToken,
    expiresAtMs: now + expiresInMs,
    refreshAtMs: now + refreshDelayMs,
    revision: accessTokenSnapshot.revision + 1,
    sessionGeneration: expectedGeneration,
    refreshEligibility: "available",
    sessionPhase: accessTokenSnapshot.sessionPhase,
  });

  return true;
}

export function beginAccessTokenSession() {
  updateAccessTokenSnapshot({
    token: null,
    expiresAtMs: null,
    refreshAtMs: null,
    revision: accessTokenSnapshot.revision + 1,
    sessionGeneration: accessTokenSnapshot.sessionGeneration + 1,
    refreshEligibility: "unknown",
    sessionPhase: "active",
  });

  return accessTokenSnapshot.sessionGeneration;
}

export function invalidateAccessTokenSession({
  expectedGeneration,
  expectedRevision,
}: {
  expectedGeneration?: number;
  expectedRevision?: number;
} = {}) {
  if (
    (expectedGeneration !== undefined &&
      accessTokenSnapshot.sessionGeneration !== expectedGeneration) ||
    (expectedRevision !== undefined &&
      accessTokenSnapshot.revision !== expectedRevision)
  ) {
    return false;
  }

  if (
    accessTokenSnapshot.token === null &&
    accessTokenSnapshot.refreshEligibility === "unavailable" &&
    accessTokenSnapshot.sessionPhase === "inactive"
  ) {
    return true;
  }

  updateAccessTokenSnapshot({
    token: null,
    expiresAtMs: null,
    refreshAtMs: null,
    revision: accessTokenSnapshot.revision + 1,
    sessionGeneration: accessTokenSnapshot.sessionGeneration + 1,
    refreshEligibility: "unavailable",
    sessionPhase: "inactive",
  });

  return true;
}

export function beginAccessTokenLogout() {
  if (accessTokenSnapshot.sessionPhase !== "active") {
    return null;
  }

  updateAccessTokenSnapshot({
    ...accessTokenSnapshot,
    sessionPhase: "logging-out",
  });

  return accessTokenSnapshot.sessionGeneration;
}

export function cancelAccessTokenLogout(expectedGeneration: number) {
  if (
    accessTokenSnapshot.sessionGeneration !== expectedGeneration ||
    accessTokenSnapshot.sessionPhase !== "logging-out"
  ) {
    return false;
  }

  updateAccessTokenSnapshot({
    ...accessTokenSnapshot,
    sessionPhase: "active",
  });

  return true;
}

export function clearAccessToken() {
  invalidateAccessTokenSession();
}

export function subscribeAccessToken(listener: () => void) {
  accessTokenListeners.add(listener);

  return () => {
    accessTokenListeners.delete(listener);
  };
}
