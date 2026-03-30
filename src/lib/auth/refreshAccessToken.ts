import { buildApiUrl } from "@/lib/api/client";
import { setAccessToken } from "@/lib/auth/accessToken";

export const ACCESS_TOKEN_REFRESH_INTERVAL_MS = 2 * 60 * 60 * 1000;

type RefreshAccessTokenParams = {
  signal?: AbortSignal;
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

export async function refreshAccessToken({
  signal,
}: RefreshAccessTokenParams = {}) {
  const response = await fetch(buildApiUrl("/v1/auth/token/refresh"), {
    method: "POST",
    credentials: "include",
    signal,
  });

  if (response.ok) {
    await syncAccessToken(response);
  }

  return response;
}
