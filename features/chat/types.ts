export type ChatRoom = {
  patternId: string;
  name: string;
  participants: string;
  statusText: string;
  unreadCount: number;
};

export type ChatMessage = {
  id: string;
  sender: "other" | "me";
  senderName?: string;
  time: string;
  lines: string[];
};

export type ChatRoomMeta = {
  title: string;
  participants: string;
};
