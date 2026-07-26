import { clearAccessToken, getAccessToken } from "@/lib/auth/accessToken";
import { refreshAccessToken } from "@/lib/auth/refreshAccessToken";

export type ApiFetchParams = {
  input: RequestInfo | URL;
  init?: RequestInit;
};

export type FetchAuthMode = "public" | "optional" | "required";

function buildRequestInit(
  init: RequestInit | undefined,
  accessToken: string | null,
  defaultCredentials: RequestCredentials,
) {
  const headers = new Headers(init?.headers);

  headers.delete("Authorization");

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  return {
    ...init,
    headers,
    credentials: init?.credentials ?? defaultCredentials,
  } satisfies RequestInit;
}

function createUnauthorizedResponse() {
  return new Response(null, { status: 401 });
}

async function refreshSession() {
  return refreshAccessToken({ mode: "required" });
}

export async function request({
  input,
  init,
  authMode,
}: ApiFetchParams & { authMode: FetchAuthMode }) {
  if (authMode === "public") {
    return fetch(input, buildRequestInit(init, null, "omit"));
  }

  let accessToken = getAccessToken();
  let hasRefreshed = false;

  if (authMode === "required" && !accessToken) {
    const refreshResponse = await refreshSession();
    hasRefreshed = true;

    if (!refreshResponse.ok) {
      return createUnauthorizedResponse();
    }

    init?.signal?.throwIfAborted();
    accessToken = getAccessToken();

    if (!accessToken) {
      return createUnauthorizedResponse();
    }
  }

  const firstResponse = await fetch(
    input,
    buildRequestInit(init, accessToken, "include"),
  );
  const canRefreshAfterUnauthorized =
    firstResponse.status === 401 &&
    !hasRefreshed &&
    (authMode === "required" || accessToken !== null);

  if (!canRefreshAfterUnauthorized) {
    return firstResponse;
  }

  const refreshResponse = await refreshSession();

  if (!refreshResponse.ok) {
    return firstResponse;
  }

  init?.signal?.throwIfAborted();
  accessToken = getAccessToken();

  if (!accessToken) {
    return firstResponse;
  }

  const retryResponse = await fetch(
    input,
    buildRequestInit(init, accessToken, "include"),
  );

  if (retryResponse.status === 401) {
    clearAccessToken();
  }

  return retryResponse;
}
