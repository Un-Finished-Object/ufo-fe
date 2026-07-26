import { http } from "msw";
import { mockChatMessages } from "@/mocks/fixtures/chat";
import { mockState } from "@/mocks/state/mockState";
import { apiError, apiSuccess, requireMockAuth } from "@/mocks/utils/response";

const ADMIN_CHAT_PAGE_SIZE = 2;

function parsePositiveInteger(value: string | undefined) {
  const parsedValue = Number(value);

  return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : null;
}

export const adminChatHandlers = [
  http.get("/v1/admin/chats", ({ request }) => {
    if (!requireMockAuth(request)) return apiError(401, "Unauthorized");

    const requestedPage = Number(new URL(request.url).searchParams.get("page") ?? "1");
    const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
    const startIndex = (page - 1) * ADMIN_CHAT_PAGE_SIZE;
    const chats = mockState.adminChatRooms
      .slice(startIndex, startIndex + ADMIN_CHAT_PAGE_SIZE)
      .map((chat) =>
        mockState.adminDeletedMessageRoomIds.has(chat.chatId)
          ? { ...chat, lastMessage: "삭제한 메시지입니다", lastMessageDeleted: true }
          : chat,
      );
    const totalPages = Math.ceil(mockState.adminChatRooms.length / ADMIN_CHAT_PAGE_SIZE);

    return apiSuccess({
      chats,
      page,
      nextPages: Math.max(totalPages - page, 0),
    });
  }),
  http.post("/v1/admin/chats/:chatRoomId/messages/:messageId/check", ({ params, request }) => {
    if (!requireMockAuth(request)) return apiError(401, "Unauthorized");

    const chatRoomId = parsePositiveInteger(params.chatRoomId as string | undefined);
    const messageId = parsePositiveInteger(params.messageId as string | undefined);
    const room = mockState.adminChatRooms.find((chat) => chat.chatId === chatRoomId);
    const messageExists = mockChatMessages.some((message) => message.messageId === messageId);

    if (!chatRoomId || !messageId || !room || !messageExists) {
      return apiError(404, "Chat message not found");
    }

    const readKey = `${chatRoomId}:${messageId}`;

    if (!mockState.adminReadMessageIds.has(readKey)) {
      mockState.adminReadMessageIds.add(readKey);
      room.unRead = Math.max(room.unRead - 1, 0);
    }

    mockState.adminLastReadMessageIds.set(chatRoomId, messageId);

    return apiSuccess({
      chatRoomId,
      messageId,
      checkedAt: new Date().toISOString(),
    });
  }),
  http.delete("/v1/admin/chats/:chatRoomId/messages/:messageId", ({ params, request }) => {
    if (!requireMockAuth(request)) return apiError(401, "Unauthorized");

    const chatRoomId = parsePositiveInteger(params.chatRoomId as string | undefined);
    const messageId = parsePositiveInteger(params.messageId as string | undefined);
    const messageExists = mockChatMessages.some((message) => message.messageId === messageId);

    if (!chatRoomId || !messageId || !messageExists) {
      return apiError(404, "Chat message not found");
    }

    const deletedAt = new Date().toISOString();
    mockState.adminDeletedChatMessages.set(messageId, deletedAt);
    mockState.adminDeletedMessageRoomIds.add(chatRoomId);
    const room = mockState.adminChatRooms.find((chat) => chat.chatId === chatRoomId);
    if (room) {
      room.lastMessage = "삭제한 메시지입니다";
      room.lastMessageDeleted = true;
    }

    return apiSuccess({ chatRoomId, messageId, deletedAt });
  }),
];
