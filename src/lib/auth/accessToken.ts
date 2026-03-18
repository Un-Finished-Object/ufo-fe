let accessToken: string | null = null;
const accessTokenListeners = new Set<() => void>();

function notifyAccessTokenListeners() {
  accessTokenListeners.forEach((listener) => {
    listener();
  });
}

export function getAccessToken() {
  return accessToken;
}

export function setAccessToken(token: string | null | undefined) {
  const normalizedToken = token?.trim();
  const nextToken = normalizedToken ? normalizedToken : null;

  if (accessToken === nextToken) {
    return;
  }

  accessToken = nextToken;
  notifyAccessTokenListeners();
}

export function clearAccessToken() {
  if (!accessToken) {
    return;
  }

  accessToken = null;
  notifyAccessTokenListeners();
}

export function subscribeAccessToken(listener: () => void) {
  accessTokenListeners.add(listener);

  return () => {
    accessTokenListeners.delete(listener);
  };
}
