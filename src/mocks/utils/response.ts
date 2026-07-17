import { delay, HttpResponse } from "msw";
import { getMockDelay } from "@/mocks/config";

export async function applyMockDelay() {
  await delay(getMockDelay());
}

export function apiSuccess<T>(data: T, status = 200) {
  return HttpResponse.json({ data, error: null }, { status });
}

export function apiError(status: number, message: string) {
  return HttpResponse.json(
    { data: null, error: { code: String(status), message } },
    { status },
  );
}

export function requireMockAuth(request: Request) {
  return request.headers.has("Authorization") && request.headers.get("Authorization") !== "Bearer expired";
}
