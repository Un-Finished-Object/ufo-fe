let accessToken: string | null = null;

export function getAccessToken() {
  return accessToken;
}

export function setAccessToken(token: string | null | undefined) {
  const normalizedToken = token?.trim();
  accessToken = normalizedToken ? normalizedToken : null;
}

export function clearAccessToken() {
  accessToken = null;
}
