export type ChatMessage = {
  messageId: string | null;
  clientMessageId?: string;
  senderId?: string | null;
  senderName?: string;
  text: string;
  createdAt: string | null;
  status?: "pending" | "confirmed";
};

export type ChatRoom = {
  patternId: string;
  name: string;
  favorite: boolean;
  isHidden: boolean;
  unreadCount: number;
};
