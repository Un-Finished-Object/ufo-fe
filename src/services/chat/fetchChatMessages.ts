import type { ChatMessage } from "@/src/types/chat";

const chatMessagesByRoomId: Record<string, ChatMessage[]> = {
  "pattern-1001": [
    {
      messageId: "pattern-1001-message-1",
      senderId: "뜨개연필",
      text: "이 패턴 3단 시작하신 분 계신가요?",
      createdAt: "2026-03-10T09:20:00.000Z",
    },
    {
      messageId: "pattern-1001-message-2",
      senderId: "실타래모음",
      text: "저는 지금 소매 뜨는 중인데 꽤 재밌어요.",
      createdAt: "2026-03-10T09:22:00.000Z",
    },
  ],
  "pattern-1002": [
    {
      messageId: "pattern-1002-message-1",
      senderId: "바늘콩",
      text: "토끼 귀 부분에서 코 수가 안 맞아요.",
      createdAt: "2026-03-10T10:05:00.000Z",
    },
    {
      messageId: "pattern-1002-message-2",
      senderId: "me",
      text: "혹시 14단에서 한 코 빠뜨리신 건 아닐까요?",
      createdAt: "2026-03-10T10:07:00.000Z",
    },
  ],
  "pattern-1003": [
    {
      messageId: "pattern-1003-message-1",
      senderId: "shawl-lover",
      text: "실 대체 추천 있으신 분 있나요?",
      createdAt: "2026-03-10T11:10:00.000Z",
    },
  ],
  "pattern-2001": [
    {
      messageId: "pattern-2001-message-1",
      senderId: "모헤어덕후",
      text: "머플러 길이 어느 정도로 뜨고 계세요?",
      createdAt: "2026-03-10T12:15:00.000Z",
    },
  ],
  "room-1": [
    {
      messageId: "room-1-message-1",
      senderId: "sample-user",
      text: "room-1 mock message",
      createdAt: "2026-03-10T08:00:00.000Z",
    },
  ],
  "room-2": [
    {
      messageId: "room-2-message-1",
      senderId: "sample-user",
      text: "room-2 mock message",
      createdAt: "2026-03-10T08:05:00.000Z",
    },
  ],
};

export async function fetchChatMessages(roomId: string) {
  await new Promise((resolve) => setTimeout(resolve, 300));

  const messages = chatMessagesByRoomId[roomId] ?? [];

  return messages.map((message) => ({ ...message }));
}
