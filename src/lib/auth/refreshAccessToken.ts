import { buildApiUrl } from "@/lib/api/client";

const REFRESH_REQUEST_TIMEOUT_MS = 10 * 1000;

type RefreshResponsePayload = {
  data?: {
    accessToken?: string;
    tokenType?: string;
    expiresIn?: number;
  };
  error?: unknown;
};

export type AccessTokenRefreshResult =
  | {
      type: "success";
      token: string;
      expiresInMs: number;
    }
  | {
      type: "unauthorized";
      status: 401 | 403;
    }
  | {
      type: "transient-error";
      status?: number;
    };

export async function requestAccessTokenRefresh(): Promise<AccessTokenRefreshResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, REFRESH_REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(buildApiUrl("/v1/auth/token/refresh"), {
      method: "POST",
      credentials: "include",
      signal: controller.signal,
    });

    if (response.status === 401 || response.status === 403) {
      return { type: "unauthorized", status: response.status };
    }

    if (!response.ok) {
      return { type: "transient-error", status: response.status };
    }

    const contentType = response.headers.get("content-type") ?? "";

    if (!contentType.includes("application/json")) {
      return { type: "transient-error", status: 502 };
    }

    const payload = (await response.json()) as RefreshResponsePayload;
    const token = payload.data?.accessToken?.trim();
    const expiresInMs = payload.data?.expiresIn;

    if (
      !token ||
      typeof expiresInMs !== "number" ||
      !Number.isSafeInteger(expiresInMs) ||
      expiresInMs <= 0
    ) {
      return { type: "transient-error", status: 502 };
    }

    return { type: "success", token, expiresInMs };
  } catch {
    return { type: "transient-error" };
  } finally {
    clearTimeout(timeoutId);
  }
}
