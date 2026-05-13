import { getAccessToken } from "@/lib/auth/accessToken";
import { refreshAccessToken } from "@/lib/auth/refreshAccessToken";

type FetchWithAuthRetryParams = {
  input: RequestInfo | URL;
  init?: RequestInit;
  skipRefresh?: boolean;
};

function buildRequestInit(init: RequestInit | undefined) {
  const accessToken = getAccessToken();
  const headers = new Headers(init?.headers);

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  return {
    ...init,
    headers,
    credentials: init?.credentials ?? "include",
  } satisfies RequestInit;
}

export async function fetchWithAuthRetry({
  input,
  init,
  skipRefresh = false,
}: FetchWithAuthRetryParams) {
  const firstRequestInit = buildRequestInit(init);
  const firstResponse = await fetch(input, firstRequestInit);

  if (skipRefresh || firstResponse.status !== 401) {
    return firstResponse;
  }

  const refreshResponse = await refreshAccessToken({
    signal: init?.signal ?? undefined,
    mode: "auto",
  });

  if (!refreshResponse.ok) {
    return firstResponse;
  }

  const retryRequestInit = buildRequestInit(init);
  return fetch(input, retryRequestInit);
}
