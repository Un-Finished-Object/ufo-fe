import {
  getAccessTokenSnapshot,
  invalidateAccessTokenSession,
  type AccessTokenSnapshot,
} from "@/lib/auth/accessToken";
import { ensureFreshAccessToken } from "@/lib/auth/refreshCoordinator";

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

function createRefreshUnavailableResponse() {
  return new Response(null, {
    status: 503,
    statusText: "Authentication refresh unavailable",
  });
}

function canUseAccessToken(snapshot: AccessTokenSnapshot) {
  return snapshot.token !== null;
}

async function retryWithCurrentAccessToken({
  input,
  init,
}: ApiFetchParams) {
  init?.signal?.throwIfAborted();
  const retrySnapshot = getAccessTokenSnapshot();

  if (!canUseAccessToken(retrySnapshot)) {
    return null;
  }

  const response = await fetch(
    input,
    buildRequestInit(init, retrySnapshot.token, "include"),
  );

  if (response.status === 401) {
    invalidateAccessTokenSession({
      expectedGeneration: retrySnapshot.sessionGeneration,
      expectedRevision: retrySnapshot.revision,
    });
  }

  return response;
}

export async function request({
  input,
  init,
  authMode,
}: ApiFetchParams & { authMode: FetchAuthMode }) {
  if (authMode === "public") {
    return fetch(input, buildRequestInit(init, null, "omit"));
  }

  let requestSnapshot = getAccessTokenSnapshot();

  if (authMode === "required" && !canUseAccessToken(requestSnapshot)) {
    const refreshResult = await ensureFreshAccessToken({ reason: "bootstrap" });

    if (refreshResult.type === "transient-error") {
      return createRefreshUnavailableResponse();
    }

    if (refreshResult.type !== "refreshed" && refreshResult.type !== "fresh") {
      return createUnauthorizedResponse();
    }

    init?.signal?.throwIfAborted();
    requestSnapshot = getAccessTokenSnapshot();

    if (!canUseAccessToken(requestSnapshot)) {
      return createUnauthorizedResponse();
    }
  }

  const firstResponse = await fetch(
    input,
    buildRequestInit(init, requestSnapshot.token, "include"),
  );
  const canRefreshAfterUnauthorized =
    firstResponse.status === 401 &&
    (authMode === "required" || requestSnapshot.token !== null);

  if (!canRefreshAfterUnauthorized) {
    return firstResponse;
  }

  const currentSnapshot = getAccessTokenSnapshot();

  if (
    currentSnapshot.sessionGeneration !== requestSnapshot.sessionGeneration
  ) {
    return firstResponse;
  }

  if (
    currentSnapshot.token &&
    currentSnapshot.revision !== requestSnapshot.revision
  ) {
    return (await retryWithCurrentAccessToken({ input, init })) ?? firstResponse;
  }

  const refreshResult = await ensureFreshAccessToken({ reason: "unauthorized" });

  if (refreshResult.type === "recently-refreshed") {
    invalidateAccessTokenSession({
      expectedGeneration: currentSnapshot.sessionGeneration,
      expectedRevision: currentSnapshot.revision,
    });
    return firstResponse;
  }

  if (refreshResult.type === "transient-error") {
    return authMode === "required"
      ? createRefreshUnavailableResponse()
      : firstResponse;
  }

  if (refreshResult.type !== "refreshed" && refreshResult.type !== "fresh") {
    return firstResponse;
  }

  return (await retryWithCurrentAccessToken({ input, init })) ?? firstResponse;
}
