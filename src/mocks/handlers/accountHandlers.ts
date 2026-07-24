import { http } from "msw";
import { mockChats, mockPatterns } from "@/mocks/fixtures/core";
import { mockChatMessages } from "@/mocks/fixtures/chat";
import { mockState } from "@/mocks/state/mockState";
import { apiError, apiSuccess, requireMockAuth } from "@/mocks/utils/response";

export const accountHandlers = [
  http.get("/v1/referral", ({ request }) =>
    requireMockAuth(request)
      ? apiSuccess({ username: mockState.user.nickname, referralCode: "AAAADDDDD" })
      : apiError(401, "Unauthorized"),
  ),
  http.post("/v1/referral", async ({ request }) => {
    if (!requireMockAuth(request)) return apiError(401, "Unauthorized");
    const body = await request.json() as { referralCode?: string };
    return apiSuccess({ valid: body.referralCode === "AAAADDDDD" });
  }),
  http.get("/v1/credits/rules", () => apiSuccess({
    dailyMaxEarnCredits: 30,
    earnRules: [
      { key: "SIGN_UP", amount: 50, description: "회원 가입", dailyLimitExempt: true },
      { key: "ATTENDANCE", amount: 5, description: "출석체크 (연속 출석 시 보상 증가)", dailyLimitExempt: false },
      { key: "FRIEND_INVITATION", amount: 150, description: "친구 초대", dailyLimitExempt: true },
    ],
    spendRules: [
      { key: "YARN_ALTERNATIVE", amount: 10, description: "대체 실 추천", dailyLimitExempt: true },
      { key: "PATTERN_CHAT", amount: 10, description: "채팅방", dailyLimitExempt: true },
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
  http.get("/v1/chat/:chatId/messages", ({ params, request }) => {
    if (!requireMockAuth(request)) return apiError(401, "Unauthorized");

    const chatId = Number(params.chatId);
    const cursor = new URL(request.url).searchParams.get("messageId");
    const cursorMessageId = cursor ? Number(cursor) : null;
    const defaultLastReadMessageId =
      chatId === 102 ? 15 : chatId === 103 ? null : chatId === 104 ? 999 : 3;
    const entryLastReadMessageId =
      mockState.adminLastReadMessageIds.get(chatId) ?? defaultLastReadMessageId;
    const page =
      cursorMessageId === null
        ? {
            messages: mockChatMessages.slice(12),
            hasNext: true,
            nextMessageId: 12,
            lastMessageId: entryLastReadMessageId,
          }
        : cursorMessageId === 12
          ? {
              messages: mockChatMessages.slice(4, 12),
              hasNext: true,
              nextMessageId: 4,
              lastMessageId: 20,
            }
          : {
              messages: mockChatMessages.slice(0, 4),
              hasNext: false,
              nextMessageId: null,
              lastMessageId: 20,
            };

    return apiSuccess({
      lastMessageId: page.lastMessageId,
      hasNext: page.hasNext,
      nextMessageId: page.nextMessageId,
      messages: page.messages.map((message) => ({
        ...message,
        deletedAt:
          mockState.adminDeletedChatMessages.get(message.messageId) ??
          message.deletedAt ??
          null,
      })),
    });
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
