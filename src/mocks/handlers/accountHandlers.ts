import { http } from "msw";
import { mockChats, mockPatterns } from "@/mocks/fixtures/core";
import { mockState } from "@/mocks/state/mockState";
import { apiError, apiSuccess, requireMockAuth } from "@/mocks/utils/response";

export const accountHandlers = [
  http.get("/v1/credits/rules", () => apiSuccess({
    dailyMaxEarnCredits: 30,
    earnRules: [
      { key: "ATTENDANCE", amount: 5, description: "매일 출석", dailyLimitExempt: false },
      { key: "STYLE_POST", amount: 10, description: "스타일 게시글 작성", dailyLimitExempt: false },
    ],
    spendRules: [
      { key: "PATTERN_CHAT", amount: 20, description: "도안 채팅방 입장", dailyLimitExempt: true },
      { key: "YARN_ALTERNATIVE", amount: 20, description: "대체 실 정보 확인", dailyLimitExempt: true },
    ],
  })),
  http.get("/v1/credits/transactions", ({ request }) => {
    if (!requireMockAuth(request)) return apiError(401, "Unauthorized");
    return apiSuccess({ items: [
      { id: "credit-1", type: "earn", amount: 5, balanceAfter: 120, reason: "attendance", createdAt: "2026-07-17T09:00:00+09:00" },
      { id: "credit-2", type: "spend", amount: -20, balanceAfter: 115, reason: "chat", createdAt: "2026-07-16T11:00:00+09:00" },
    ], page: 1, nextPage: 0 });
  }),
  http.get("/v1/users/me/projects", ({ request }) => {
    if (!requireMockAuth(request)) return apiError(401, "Unauthorized");
    return apiSuccess({ projects: [{ patternId: 1, patternName: mockPatterns[0].title, thumbnailUrl: mockPatterns[0].thumbnailUrl, author: mockPatterns[0].author, purchaseYarn: true, purchaseYarnDate: "2026-07-10", purchaseChat: true, purchaseChatId: 101, purchaseChatDate: "2026-07-11" }], nextPage: 0 });
  }),
  http.get("/v1/attendance/status", ({ request }) => {
    if (!requireMockAuth(request)) return apiError(401, "Unauthorized");
    return apiSuccess({ rewarded: Array.from(mockState.attendanceDates).map((date) => ({ date, rewarded: true })) });
  }),
  http.post("/v1/attendance/check", ({ request }) => {
    if (!requireMockAuth(request)) return apiError(401, "Unauthorized");
    const date = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });
    mockState.attendanceDates.add(date);
    mockState.balance += 5;
    return apiSuccess({ date, rewarded: true, rewardAmount: 5, balance: mockState.balance });
  }),
  http.get("/v1/styles", () => apiSuccess({ items: [
    { id: 1, author: "뜨개구름", likeCount: 24, image: "/mock/plush-pink.svg" },
    { id: 2, author: "한코두코", likeCount: 17, image: "/mock/plush-white.svg" },
  ] })),
  http.get("/v1/users/me/scraps/styles", ({ request }) =>
    requireMockAuth(request) ? apiSuccess({ items: [{ id: 1, title: "분홍 인형 완성", author: "뜨개구름", image: "/mock/plush-pink.svg" }] }) : apiError(401, "Unauthorized"),
  ),
  http.get("/v1/users/me/chats", ({ request }) => {
    if (!requireMockAuth(request)) return apiError(401, "Unauthorized");
    return apiSuccess({ chats: mockState.chats, page: 1, nextPage: 0 });
  }),
  http.get("/v1/chat/:chatId/messages", ({ request }) => {
    if (!requireMockAuth(request)) return apiError(401, "Unauthorized");
    return apiSuccess({ lastMessageId: 3, hasNext: false, nextMessageId: null, messages: [
      { messageId: 1, senderName: "한코두코", text: "안녕하세요! 같이 즐겁게 떠요.", createdAt: "2026-07-17T09:00:00+09:00" },
      { messageId: 2, senderName: "뜨개구름", text: "저는 몸통부터 시작했어요.", createdAt: "2026-07-17T09:05:00+09:00" },
      { messageId: 3, senderName: "한코두코", text: "소매 분리까지 떴어요!", replySenderName: "뜨개구름", replyMessageId: 2, createdAt: "2026-07-17T09:10:00+09:00" },
    ] });
  }),
  http.patch("/v1/chat/:chatId/status", async ({ params, request }) => {
    if (!requireMockAuth(request)) return apiError(401, "Unauthorized");
    const body = await request.json() as { favorite?: boolean; hidden?: boolean };
    const chatId = Number(params.chatId);
    const chat = mockState.chats.find((item) => item.chatId === chatId) ?? mockChats[0];
    chat.favorite = body.favorite ?? chat.favorite;
    chat.isHidden = body.hidden ?? chat.isHidden;
    return apiSuccess({ chatId, favorite: chat.favorite, isHidden: chat.isHidden });
  }),
];
