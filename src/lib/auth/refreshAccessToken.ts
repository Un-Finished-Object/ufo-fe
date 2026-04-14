import { buildApiUrl } from "@/lib/api/client";
import { clearAccessToken, setAccessToken } from "@/lib/auth/accessToken";

export const ACCESS_TOKEN_REFRESH_INTERVAL_MS = 2 * 60 * 60 * 1000;
const AUTO_REFRESH_COOLDOWN_MS = 30 * 1000;

type RefreshMode = "auto" | "required";

type RefreshAccessTokenParams = {
  signal?: AbortSignal;
  mode?: RefreshMode;
};

type RefreshResponsePayload = {
  data?: {
    accessToken?: string;
    access_token?: string;
    token?: string;
  };
  accessToken?: string;
  access_token?: string;
  token?: string;
  error?: unknown;
};

function getAccessTokenFromPayload(payload: RefreshResponsePayload) {
  return (
    payload.data?.accessToken ??
    payload.data?.access_token ??
    payload.data?.token ??
    payload.accessToken ??
    payload.access_token ??
    payload.token ??
    null
  );
}

async function syncAccessToken(response: Response) {
  const authorizationHeader = response.headers.get("Authorization") ?? response.headers.get("authorization");

  if (authorizationHeader?.startsWith("Bearer ")) {
    setAccessToken(authorizationHeader.slice("Bearer ".length));
    return;
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return;
  }

  try {
    const payload = (await response.clone().json()) as RefreshResponsePayload;
    setAccessToken(getAccessTokenFromPayload(payload));
  } catch {
    // Ignore malformed refresh payloads and keep the existing in-memory token.
  }
}

let refreshRequestPromise: Promise<Response> | null = null;
let lastAutoRefreshFailureAt = 0;

export async function refreshAccessToken({
  signal,
  mode = "auto",
}: RefreshAccessTokenParams = {}) {
  if (
    mode === "auto" &&
    lastAutoRefreshFailureAt > 0 &&
    Date.now() - lastAutoRefreshFailureAt < AUTO_REFRESH_COOLDOWN_MS
  ) {
    return new Response(null, { status: 401 });
  }

  if (refreshRequestPromise) {
    return refreshRequestPromise;
  }

  refreshRequestPromise = (async () => {
    const response = await fetch(buildApiUrl("/v1/auth/token/refresh"), {
      method: "POST",
      credentials: "include",
      signal,
    });

    if (response.ok) {
      await syncAccessToken(response);
      lastAutoRefreshFailureAt = 0;
      return response;
    }

    if (mode === "auto" && (response.status === 401 || response.status === 403)) {
      lastAutoRefreshFailureAt = Date.now();
      clearAccessToken();
    }

    return response;
  })().finally(() => {
    refreshRequestPromise = null;
  });

  return refreshRequestPromise;
}
