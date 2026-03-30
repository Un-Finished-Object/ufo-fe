import { clearAccessToken, getAccessToken } from "@/lib/auth/accessToken";
import { refreshAccessToken } from "@/lib/auth/refreshAccessToken";

type FetchWithAuthRetryParams = {
  apiBase: string;
  input: RequestInfo | URL;
  init?: RequestInit;
  skipRefresh?: boolean;
};

async function buildRequestInit(
  apiBase: string,
  init: RequestInit | undefined,
  skipRefresh: boolean,
) {
  let accessToken = getAccessToken();

  if (!skipRefresh && !accessToken) {
    try {
      const refreshResponse = await refreshAccessToken({
        apiBase,
        signal: init?.signal ?? undefined,
      });

      if (refreshResponse.ok) {
        accessToken = getAccessToken();
      }
    } catch {
      // Keep the original request flow when refresh preflight fails.
    }
  }

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
  apiBase,
  input,
  init,
  skipRefresh = false,
}: FetchWithAuthRetryParams) {
  const firstRequestInit = await buildRequestInit(apiBase, init, skipRefresh);
  const firstResponse = await fetch(input, firstRequestInit);

  if (skipRefresh || firstResponse.status !== 401) {
    return firstResponse;
  }

  const refreshResponse = await refreshAccessToken({
    apiBase,
    signal: init?.signal ?? undefined,
  });

  if (!refreshResponse.ok) {
    if (refreshResponse.status === 401 || refreshResponse.status === 403) {
      clearAccessToken();
    }

    return firstResponse;
  }

  const retryRequestInit = await buildRequestInit(apiBase, init, true);
  return fetch(input, retryRequestInit);
}
