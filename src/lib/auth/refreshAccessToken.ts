import { buildApiUrl } from "@/lib/api/client";
import { clearAccessToken, setAccessToken } from "@/lib/auth/accessToken";

const AUTO_REFRESH_COOLDOWN_MS = 30 * 1000;

type RefreshMode = "auto" | "required";

type RefreshAccessTokenParams = {
  signal?: AbortSignal;
  mode?: RefreshMode;
};

type RefreshResponsePayload = {
  data: {
    accessToken: string;
    tokenType: string;
    expiresIn: number;
  };
  error?: unknown;
};

async function syncAccessToken(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return false;
  }

  try {
    const payload = (await response.clone().json()) as RefreshResponsePayload;
    const token = payload.data.accessToken?.trim();
    const expiresIn = payload.data.expiresIn;

    if (!token || !Number.isFinite(expiresIn) || expiresIn <= 0) {
      return false;
    }

    setAccessToken(token, expiresIn);
    return true;
  } catch {
    return false;
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
      const didSyncAccessToken = await syncAccessToken(response);

      if (!didSyncAccessToken) {
        return new Response(null, { status: 502 });
      }

      lastAutoRefreshFailureAt = 0;
      return response;
    }

    if (response.status === 401 || response.status === 403) {
      if (mode === "auto") {
        lastAutoRefreshFailureAt = Date.now();
      }

      clearAccessToken();
    }

    return response;
  })().finally(() => {
    refreshRequestPromise = null;
  });

  return refreshRequestPromise;
}
