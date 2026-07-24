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
  http.post("/v1/auth/signup", async ({ request }) => {
    await applyMockDelay();
    if (!requireMockAuth(request)) return apiError(401, "Unauthorized");
    const body = await request.json() as {
      userName?: string;
      profileImageKey?: string | null;
      keywords?: string[];
    };
    mockState.user = {
      ...mockState.user,
      ...(body.userName ? { nickname: body.userName } : {}),
      ...(body.profileImageKey ? { profileImage: "/mock/pattern-card.svg" } : {}),
    };
    mockState.interests = Array.isArray(body.keywords) ? body.keywords : [];
    return apiSuccess({
      userId: mockState.user.userId,
      userName: mockState.user.nickname,
      profileImageUrl: mockState.user.profileImage,
      keywords: mockState.interests,
    });
  }),
  http.patch("/v1/users/me", async ({ request }) => {
    await applyMockDelay();
    if (!requireMockAuth(request)) return apiError(401, "Unauthorized");
    const body = await request.json() as { userName?: string | null; profileImageKey?: string | null };
    mockState.user = {
      ...mockState.user,
      ...(body.userName ? { nickname: body.userName } : {}),
      ...(body.profileImageKey ? { profileImage: "/mock/pattern-card.svg" } : {}),
    };
    return apiSuccess(mockState.user);
  }),
  http.get("/v1/users/nicknames/:username/check", async ({ params }) => {
    await applyMockDelay();
    const username = String(params.username ?? "");
    return apiSuccess({ exists: username === mockState.user.nickname });
  }),
  http.post("/v1/auth/logout", async () => {
    mockState.authenticated = false;
    return apiSuccess(null);
  }),
  http.get("/v1/credits/wallet", ({ request }) =>
    requireMockAuth(request) ? apiSuccess({ balance: mockState.balance }) : apiError(401, "Unauthorized"),
  ),
];
