let accessToken: string | null = null;
let accessTokenExpiresAt: number | null = null;
const accessTokenListeners = new Set<() => void>();

function notifyAccessTokenListeners() {
  accessTokenListeners.forEach((listener) => {
    listener();
  });
}

export function getAccessToken() {
  return accessToken;
}

export function getAccessTokenExpiresAt() {
  return accessTokenExpiresAt;
}

export function setAccessToken(
  token: string | null | undefined,
  expiresInSeconds?: number,
) {
  const normalizedToken = token?.trim();
  const nextToken = normalizedToken ? normalizedToken : null;
  const nextExpiresAt =
    nextToken &&
    typeof expiresInSeconds === "number" &&
    Number.isFinite(expiresInSeconds) &&
    expiresInSeconds > 0
      ? Date.now() + expiresInSeconds * 1000
      : null;

  if (accessToken === nextToken && accessTokenExpiresAt === nextExpiresAt) {
    return;
  }

  accessToken = nextToken;
  accessTokenExpiresAt = nextExpiresAt;
  notifyAccessTokenListeners();
}

export function clearAccessToken() {
  if (!accessToken && accessTokenExpiresAt === null) {
    return;
  }

  accessToken = null;
  accessTokenExpiresAt = null;
  notifyAccessTokenListeners();
}

export function subscribeAccessToken(listener: () => void) {
  accessTokenListeners.add(listener);

  return () => {
    accessTokenListeners.delete(listener);
  };
}
