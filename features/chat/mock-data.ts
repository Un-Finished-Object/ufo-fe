import type { ChatRoomMeta } from "@/features/chat/types";

export const chatFilterChips = ["전체", "즐겨찾기", "안읽음", "FO"];

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
