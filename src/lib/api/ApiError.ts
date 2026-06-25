type ApiErrorResponseBody = {
  data?: unknown;
  error?: {
    code?: string | number;
    message?: string;
  } | null;
};

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function normalizeCode(code: unknown, status: number) {
  if (typeof code === "string" && code.trim()) {
    return code.trim();
  }

  if (typeof code === "number" && Number.isFinite(code)) {
    return String(code);
  }

  return String(status);
}

function normalizeStatus(code: unknown, status: number) {
  if (status >= 400) {
    return status;
  }

  const numericCode =
    typeof code === "number"
      ? code
      : typeof code === "string"
        ? Number(code)
        : Number.NaN;

  return Number.isInteger(numericCode) && numericCode >= 400 && numericCode <= 599
    ? numericCode
    : status;
}

function getApiErrorDetails(
  error: unknown,
  status: number,
  fallbackMessage: string,
) {
  if (!error || typeof error !== "object") {
    return {
      code: String(status),
      message: fallbackMessage,
    };
  }

  const errorRecord = error as Record<string, unknown>;
  const resolvedStatus = normalizeStatus(errorRecord.code, status);

  return {
    status: resolvedStatus,
    code: normalizeCode(errorRecord.code, resolvedStatus),
    message:
      typeof errorRecord.message === "string" && errorRecord.message.trim()
        ? errorRecord.message.trim()
        : fallbackMessage,
  };
}

export function createApiError(
  error: unknown,
  {
    status,
    fallbackMessage,
  }: {
    status: number;
    fallbackMessage: string;
  },
) {
  const details = getApiErrorDetails(error, status, fallbackMessage);

  return new ApiError(details.message, details.status ?? status, details.code);
}

export async function throwApiError(
  response: Response,
  fallbackMessage: string,
): Promise<never> {
  let body: ApiErrorResponseBody | null = null;

  try {
    body = (await response.json()) as ApiErrorResponseBody;
  } catch {
    // Fall back to the HTTP status and caller-provided message.
  }

  throw createApiError(body?.error, {
    status: response.status,
    fallbackMessage,
  });
}

export function throwApiPayloadError(
  error: unknown,
  fallbackMessage: string,
  status = 200,
): never {
  throw createApiError(error, {
    status,
    fallbackMessage,
  });
}

export function createInvalidApiResponseError(fallbackMessage: string) {
  return new ApiError(fallbackMessage, 502, "INVALID_RESPONSE");
}

export function isApiError(error: unknown, status?: number): error is ApiError {
  return (
    error instanceof ApiError &&
    (typeof status !== "number" || error.status === status)
  );
}
