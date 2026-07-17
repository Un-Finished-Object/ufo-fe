import { http } from "msw";
import { mockState } from "@/mocks/state/mockState";
import { apiError, apiSuccess, applyMockDelay, requireMockAuth } from "@/mocks/utils/response";

export const authHandlers = [
  http.post("/v1/auth/token/refresh", async () => {
    await applyMockDelay();
    if (!mockState.authenticated) return apiError(401, "Unauthorized");
    return apiSuccess({ accessToken: "mock-access-token", tokenType: "Bearer", expiresIn: 7200 });
  }),
  http.get("/v1/users/me", async ({ request }) => {
    await applyMockDelay();
    return requireMockAuth(request) ? apiSuccess(mockState.user) : apiError(401, "Unauthorized");
  }),
  http.patch("/v1/users/me", async ({ request }) => {
    await applyMockDelay();
    if (!requireMockAuth(request)) return apiError(401, "Unauthorized");
    const body = await request.json() as Partial<{ nickname: string; profileImage: string }>;
    mockState.user = { ...mockState.user, ...body };
    return apiSuccess(mockState.user);
  }),
  http.post("/v1/auth/logout", async () => {
    mockState.authenticated = false;
    return apiSuccess(null);
  }),
  http.get("/v1/credits/wallet", ({ request }) =>
    requireMockAuth(request) ? apiSuccess({ balance: mockState.balance }) : apiError(401, "Unauthorized"),
  ),
];
