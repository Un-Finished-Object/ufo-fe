import type { ChatRoom, ChatRoomMeta } from "@/features/chat/types";

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

export function getRoomMeta(patternId: string): ChatRoomMeta | null {
  return roomMetaByPatternId[patternId] ?? null;
}
