import { http } from "msw";
import { mockPatternDetail, mockPatterns } from "@/mocks/fixtures/core";
import { mockState } from "@/mocks/state/mockState";
import { apiError, apiSuccess, applyMockDelay, requireMockAuth } from "@/mocks/utils/response";

function patternItems(items = mockPatterns) {
  return items.map((pattern) => ({
    ...pattern,
    my: { scrapped: mockState.scrappedPatternIds.has(pattern.id) },
  }));
}

export const patternHandlers = [
  http.get("/v1/patterns", async ({ request }) => {
    await applyMockDelay();
    const page = Number(new URL(request.url).searchParams.get("page") ?? 1);
    return apiSuccess({ items: patternItems(), page, nextPage: 0, totalPages: 1 });
  }),
  http.get("/v1/patterns/search", async ({ request }) => {
    await applyMockDelay();
    const url = new URL(request.url);
    const keyword = (url.searchParams.get("keyword") ?? "").toLowerCase();
    const items = mockPatterns.filter((pattern) => pattern.title.toLowerCase().includes(keyword));
    return apiSuccess({ items: patternItems(items), page: Number(url.searchParams.get("page") ?? 1), nextPage: 0 });
  }),
  http.get("/v1/patterns/recommend", async () => {
    await applyMockDelay();
    return apiSuccess({ items: patternItems(mockPatterns.slice(0, 3)) });
  }),
  http.get("/v1/patterns/:patternId", async ({ params }) => {
    await applyMockDelay();
    const patternId = Number(params.patternId);
    const pattern = mockPatterns.find((item) => item.id === patternId);
    if (!pattern) return apiError(404, "Pattern not found");
    return apiSuccess({
      ...mockPatternDetail,
      ...pattern,
      images: [pattern.thumbnailUrl],
      my: { scrapped: mockState.scrappedPatternIds.has(patternId) },
    });
  }),
  http.get("/v1/users/me/interests", ({ request }) =>
    requireMockAuth(request) ? apiSuccess({ keywords: mockState.interests }) : apiError(401, "Unauthorized"),
  ),
  http.patch("/v1/users/me/interests", async ({ request }) => {
    if (!requireMockAuth(request)) return apiError(401, "Unauthorized");
    const body = await request.json() as { keywords?: string[] };
    mockState.interests = Array.isArray(body.keywords) ? body.keywords : [];
    return apiSuccess({ keywords: mockState.interests });
  }),
  http.post("/v1/patterns/:patternId/scrap", ({ params, request }) => {
    if (!requireMockAuth(request)) return apiError(401, "Unauthorized");
    const patternId = Number(params.patternId);
    mockState.scrappedPatternIds.add(patternId);
    return apiSuccess({ patternId, scrapped: true });
  }),
  http.delete("/v1/patterns/:patternId/scrap", ({ params, request }) => {
    if (!requireMockAuth(request)) return apiError(401, "Unauthorized");
    const patternId = Number(params.patternId);
    mockState.scrappedPatternIds.delete(patternId);
    return apiSuccess({ patternId, scrapped: false });
  }),
  http.get("/v1/users/me/scraps", ({ request }) => {
    if (!requireMockAuth(request)) return apiError(401, "Unauthorized");
    return apiSuccess({ items: patternItems().filter((item) => item.my.scrapped), page: 1, nextPage: 0 });
  }),
  http.get("/v1/patterns/:patternId/purchase", ({ params, request }) => {
    if (!requireMockAuth(request)) return apiError(401, "Unauthorized");
    const purchase = mockState.purchases.get(Number(params.patternId));
    return apiSuccess({ userId: 1, chat: purchase?.chat ?? false, chatRoomId: purchase?.chatRoomId ?? null, alternative: purchase?.alternative ?? false });
  }),
  http.post("/v1/patterns/:patternId/purchase", async ({ params, request }) => {
    if (!requireMockAuth(request)) return apiError(401, "Unauthorized");
    const patternId = Number(params.patternId);
    const body = await request.json() as { type?: "chat" | "yarn" };
    if (body.type !== "chat" && body.type !== "yarn") return apiError(400, "Invalid purchase type");
    const current = mockState.purchases.get(patternId) ?? { chat: false, alternative: false, chatRoomId: null };
    const price = 20;
    if (mockState.balance < price) return apiError(409, "Insufficient credits");
    mockState.balance -= price;
    const next = { ...current, chat: body.type === "chat" || current.chat, alternative: body.type === "yarn" || current.alternative, chatRoomId: body.type === "chat" ? 100 + patternId : current.chatRoomId };
    mockState.purchases.set(patternId, next);
    return apiSuccess({ userId: 1, chatRoomId: next.chatRoomId, type: body.type });
  }),
  http.get("/v1/yarns/:yarnId/", ({ params }) => apiSuccess({ yarnId: Number(params.yarnId), yarnName: "메리노 포근", weight: 50, cost: 9000, component: "메리노울 100%", store: "UFO 실가게", length: 120 })),
  http.get("/v1/yarns/alternatives/:setId", ({ params, request }) =>
    requireMockAuth(request) ? apiSuccess({ items: [{ originalYarnSetId: Number(params.setId), firstYarn: { altId: 1, yarnId: 2, yarnName: "데일리 메리노", ply: 4, weight: 50, cost: 7500, component: "울 80%, 나일론 20%", store: "포근상점", length: 125, componentScore: 92, lengthScore: 95, gaugeScore: 90, needleScore: 90, username: "한코두코" }, secondYarn: null, subYarn: null }] }) : apiError(401, "Unauthorized"),
  ),
];
