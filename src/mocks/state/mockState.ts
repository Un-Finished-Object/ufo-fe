import { mockChats, mockUser } from "@/mocks/fixtures/core";
import { mockAdminChatRooms } from "@/mocks/fixtures/adminChat";

type MockState = {
  authenticated: boolean;
  balance: number;
  interests: string[];
  scrappedPatternIds: Set<number>;
  purchases: Map<number, { chat: boolean; alternative: boolean; chatRoomId: number | null }>;
  alternativeReactions: Map<number, { type: 1 | 2; likesCount: number; updatedAt: string }>;
  alternativeComments: Map<number, {
    commentId: number;
    content: string;
    username: string;
    createdAt: string;
    isMine: boolean;
  }[]>;
  user: typeof mockUser;
  chats: typeof mockChats;
  adminChatRooms: typeof mockAdminChatRooms;
  adminReadMessageIds: Set<string>;
  adminLastReadMessageIds: Map<number, number>;
  adminDeletedChatMessages: Map<number, string>;
  attendanceDates: Set<string>;
};

function createMockState(): MockState {
  return {
    authenticated: true,
    balance: 120,
    interests: ["빈티지", "오버사이즈", "아란무늬"],
    scrappedPatternIds: new Set([1, 3]),
    purchases: new Map([[1, { chat: true, alternative: true, chatRoomId: 101 }]]),
    alternativeReactions: new Map(),
    alternativeComments: new Map(),
    user: { ...mockUser },
    chats: mockChats.map((chat) => ({ ...chat })),
    adminChatRooms: mockAdminChatRooms.map((chat) => ({ ...chat })),
    adminReadMessageIds: new Set(),
    adminLastReadMessageIds: new Map(),
    adminDeletedChatMessages: new Map(),
    attendanceDates: new Set(["2026-07-01", "2026-07-08", "2026-07-15"]),
  };
}

export let mockState = createMockState();

export function resetMockState() {
  mockState = createMockState();
}
