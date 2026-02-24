import type { ChatMessage, ChatRoom, ChatRoomMeta } from "@/features/chat/types";

export const chatFilterChips = ["전체", "즐겨찾기", "안읽음", "진행중", "FO", "예정"];

export const myChatRooms: ChatRoom[] = [
  {
    patternId: "pattern-1001",
    name: "리티로포텐 가디건",
    participants: "47명",
    statusText: "대화중",
    unreadCount: 22,
  },
  {
    patternId: "pattern-1002",
    name: "손둥이 무설탕 토끼인형",
    participants: "31명",
    statusText: "대화중",
    unreadCount: 8,
  },
  {
    patternId: "pattern-1003",
    name: "봄날 숄 패턴",
    participants: "18명",
    statusText: "안읽음",
    unreadCount: 3,
  },
  {
    patternId: "pattern-1004",
    name: "데일리 니트 조끼",
    participants: "52명",
    statusText: "진행중",
    unreadCount: 14,
  },
];

export const popularChatRooms: ChatRoom[] = [
  {
    patternId: "pattern-2001",
    name: "코지 모헤어 머플러",
    participants: "64명",
    statusText: "대화중",
    unreadCount: 22,
  },
  {
    patternId: "pattern-2002",
    name: "몽글 케이블 스웨터",
    participants: "71명",
    statusText: "대화중",
    unreadCount: 17,
  },
  {
    patternId: "pattern-2003",
    name: "포근한 니트 베스트",
    participants: "58명",
    statusText: "대화중",
    unreadCount: 11,
  },
];

export const roomMetaByPatternId: Record<string, ChatRoomMeta> = {
  "pattern-1001": { title: "리티로포텐 가디건", participants: "47명" },
  "pattern-1002": { title: "손둥이 무설탕 토끼인형", participants: "31명" },
  "pattern-1003": { title: "봄날 숄 패턴", participants: "18명" },
  "pattern-1004": { title: "데일리 니트 조끼", participants: "52명" },
  "pattern-2001": { title: "코지 모헤어 머플러", participants: "64명" },
  "pattern-2002": { title: "몽글 케이블 스웨터", participants: "71명" },
  "pattern-2003": { title: "포근한 니트 베스트", participants: "58명" },
};

const messagesByPatternId: Record<string, ChatMessage[]> = {
  "pattern-1001": [
    {
      id: "m-1",
      sender: "other",
      senderName: "한정판 콩국수",
      time: "18:26",
      lines: [
        "뜨뜨개 님에게 답장",
        "3번째 줄에서 막혔는데 혹시 이 부분 알려주실 분 계신가용 ㅠㅠㅠㅠ",
        "엇 혹시 해결하셨나요 ???!",
        "제가 알려드릴 수 있을 것 같아요 !",
      ],
    },
    {
      id: "m-2",
      sender: "other",
      senderName: "한정판 콩국수",
      time: "18:26",
      lines: [
        "뜨뜨개 님에게 답장",
        "3번째 줄에서 막혔는데 혹시 이 부분 알려주실 분 계신가용 ㅠㅠㅠㅠ",
        "엇 혹시 해결하셨나요 ???!",
        "제가 알려드릴 수 있을 것 같아요 !",
      ],
    },
    {
      id: "m-3",
      sender: "me",
      time: "19:30",
      lines: ["대체실 구매하실분 있나요???"],
    },
  ],
  "pattern-1002": [
    {
      id: "m-10",
      sender: "other",
      senderName: "뜨개연필",
      time: "12:02",
      lines: ["이 패턴 시작하신 분들 계신가요?"],
    },
  ],
};

export function getRoomMeta(patternId: string): ChatRoomMeta | null {
  return roomMetaByPatternId[patternId] ?? null;
}

export function getMockMessages(patternId: string): ChatMessage[] {
  const messages = messagesByPatternId[patternId] ?? [];
  return messages.map((message) => ({ ...message, lines: [...message.lines] }));
}
