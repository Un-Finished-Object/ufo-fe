export type { ChatMessage } from "@/src/types/chat";

export type ChatRoom = {
  patternId: string;
  name: string;
  favorite: boolean;
  isHidden: boolean;
  unreadCount: number;
};

export type ChatRoomMeta = {
  title: string;
  participants: string;
};
