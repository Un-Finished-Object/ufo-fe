import { http } from "msw";
import {
  createMockPatternAlternatives,
  mockPatternDetail,
  mockPatterns,
} from "@/mocks/fixtures/core";
import { mockState } from "@/mocks/state/mockState";
import { apiError, apiSuccess, applyMockDelay, requireMockAuth } from "@/mocks/utils/response";

function patternItems(items = mockPatterns) {
  return items.map((pattern) => ({
    ...pattern,
    my: { scrapped: mockState.scrappedPatternIds.has(pattern.id) },
  }));
}

function createInitialAlternativeComments(altSetId: number) {
  return Array.from({ length: 7 }, (_, index) => ({
    commentId: altSetId * 100 + index + 1,
    content: `${altSetId}번 추천 대체실 댓글 ${index + 1}`,
    username: index === 0 ? mockState.user.nickname : `사용자${(index % 3) + 1}`,
    createdAt: `2026-02-${String(6 + index).padStart(2, "0")}T13:20:10Z`,
    isMine: index === 0,
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
    requireMockAuth(request)
      ? apiSuccess({ items: createMockPatternAlternatives(Number(params.setId)) })
      : apiError(401, "Unauthorized"),
  ),
  http.get("/v1/alternatives/:altId/reaction", ({ params, request }) => {
    if (!requireMockAuth(request)) return apiError(401, "Unauthorized");
    const altId = Number(params.altId);
    const reaction = mockState.alternativeReactions.get(altId) ?? {
      type: 2 as const,
      likesCount: altId % 7,
      updatedAt: "2026-02-06T13:20:10Z",
    };
    return apiSuccess({ altId, ...reaction });
  }),
  http.put("/v1/alternatives/:altId/reaction", async ({ params, request }) => {
    if (!requireMockAuth(request)) return apiError(401, "Unauthorized");
    const altId = Number(params.altId);
    const body = await request.json() as { type?: number };
    if (body.type !== 1 && body.type !== 2) return apiError(400, "Invalid reaction type");
    const reactionType: 1 | 2 = body.type;

    const previous = mockState.alternativeReactions.get(altId) ?? {
      type: 2 as const,
      likesCount: altId % 7,
      updatedAt: "2026-02-06T13:20:10Z",
    };
    const likesCount = reactionType === previous.type
      ? previous.likesCount
      : Math.max(0, previous.likesCount + (reactionType === 1 ? 1 : -1));
    const reaction = {
      type: reactionType,
      likesCount,
      updatedAt: new Date().toISOString(),
    };
    mockState.alternativeReactions.set(altId, reaction);
    return apiSuccess({ altId, ...reaction });
  }),
  http.get("/v1/alternatives/:altId/comments", ({ params, request }) => {
    if (!requireMockAuth(request)) return apiError(401, "Unauthorized");
    const altSetId = Number(params.altId);
    const page = Math.max(1, Number(new URL(request.url).searchParams.get("page") ?? 1));
    const pageSize = 3;
    const comments =
      mockState.alternativeComments.get(altSetId) ?? createInitialAlternativeComments(altSetId);
    const startIndex = (page - 1) * pageSize;
    const pageComments = comments.slice(startIndex, startIndex + pageSize);
    const totalPages = Math.ceil(comments.length / pageSize);
    const nextPage = Math.min(5, Math.max(0, totalPages - page));

    return apiSuccess({ altSetId, comments: pageComments, page, nextPage });
  }),
  http.post("/v1/alternatives/:altId/comments", async ({ params, request }) => {
    if (!requireMockAuth(request)) return apiError(401, "Unauthorized");
    const altSetId = Number(params.altId);
    const body = await request.json() as { content?: string };
    const content = body.content?.trim();
    if (!content) return apiError(400, "Comment content is required");

    const comment = {
      commentId: Date.now(),
      content,
      username: mockState.user.nickname,
      createdAt: new Date().toISOString(),
      isMine: true,
    };
    const currentComments =
      mockState.alternativeComments.get(altSetId) ?? createInitialAlternativeComments(altSetId);
    mockState.alternativeComments.set(altSetId, [comment, ...currentComments]);
    return apiSuccess({ altSetId, ...comment });
  }),
  http.patch("/v1/alternatives/:altId/comments/:commentId", async ({ params, request }) => {
    if (!requireMockAuth(request)) return apiError(401, "Unauthorized");
    const altSetId = Number(params.altId);
    const commentId = Number(params.commentId);
    const body = await request.json() as { content?: string };
    const content = body.content?.trim();
    if (!content) return apiError(400, "Comment content is required");

    const comments =
      mockState.alternativeComments.get(altSetId) ?? createInitialAlternativeComments(altSetId);
    const commentIndex = comments.findIndex((comment) => comment.commentId === commentId);
    if (commentIndex < 0) return apiError(404, "Comment not found");
    if (!comments[commentIndex].isMine) return apiError(403, "Forbidden");

    const updatedAt = new Date().toISOString();
    const updatedComment = { ...comments[commentIndex], content, createdAt: updatedAt };
    const nextComments = [...comments];
    nextComments[commentIndex] = updatedComment;
    mockState.alternativeComments.set(altSetId, nextComments);

    return apiSuccess({
      altSetId,
      commentId,
      content,
      username: updatedComment.username,
      updatedAt,
    });
  }),
  http.delete("/v1/alternatives/:altId/comments/:commentId", ({ params, request }) => {
    if (!requireMockAuth(request)) return apiError(401, "Unauthorized");
    const altSetId = Number(params.altId);
    const commentId = Number(params.commentId);
    const comments =
      mockState.alternativeComments.get(altSetId) ?? createInitialAlternativeComments(altSetId);
    const comment = comments.find((item) => item.commentId === commentId);
    if (!comment) return apiError(404, "Comment not found");
    if (!comment.isMine) return apiError(403, "Forbidden");

    mockState.alternativeComments.set(
      altSetId,
      comments.filter((item) => item.commentId !== commentId),
    );
    return apiSuccess({ altSetId, commentId, deletedAt: new Date().toISOString() });
  }),
];
