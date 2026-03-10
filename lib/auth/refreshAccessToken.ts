export const ACCESS_TOKEN_REFRESH_INTERVAL_MS = 2 * 60 * 60 * 1000;

type RefreshAccessTokenParams = {
  apiBase?: string;
  signal?: AbortSignal;
};

export async function refreshAccessToken({
  apiBase = process.env.NEXT_PUBLIC_API_BASE ?? "/api",
  signal,
}: RefreshAccessTokenParams = {}) {

  return fetch(`${apiBase}/v1/auth/token/refresh`, {
    method: "POST",
    credentials: "include",
    signal,
  });
}
