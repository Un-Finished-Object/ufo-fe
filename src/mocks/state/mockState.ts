import { mockChats, mockUser } from "@/mocks/fixtures/core";

type MockState = {
  authenticated: boolean;
  balance: number;
  interests: string[];
  scrappedPatternIds: Set<number>;
  purchases: Map<number, { chat: boolean; alternative: boolean; chatRoomId: number | null }>;
  user: typeof mockUser;
  chats: typeof mockChats;
  attendanceDates: Set<string>;
};

function createMockState(): MockState {
  return {
    authenticated: true,
    balance: 120,
    interests: ["스웨터", "가디건", "초보"],
    scrappedPatternIds: new Set([1, 3]),
    purchases: new Map([[1, { chat: true, alternative: true, chatRoomId: 101 }]]),
    user: { ...mockUser },
    chats: mockChats.map((chat) => ({ ...chat })),
    attendanceDates: new Set(["2026-07-01", "2026-07-08", "2026-07-15"]),
  };
}

export let mockState = createMockState();

export function resetMockState() {
  mockState = createMockState();
}
