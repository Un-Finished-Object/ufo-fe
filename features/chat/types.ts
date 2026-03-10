export type { ChatMessage } from "@/src/types/chat";

export type ChatRoom = {
  patternId: string;
  name: string;
  participants: string;
  statusText: string;
  unreadCount: number;
};

export type ChatRoomMeta = {
  title: string;
  participants: string;
};
