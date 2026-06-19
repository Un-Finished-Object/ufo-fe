export type ChatMessage = {
  messageId: string | null;
  clientMessageId?: string;
  senderId?: string | null;
  senderName?: string;
  replySenderName?: string | null;
  replyMessageId?: string | null;
  text: string;
  createdAt: string | null;
  status?: "pending" | "confirmed" | "failed";
};

export type ChatRoom = {
  chatId: string;
  patternId: string;
  name: string;
  imageUrl: string | null;
  favorite: boolean;
  isHidden: boolean;
  unreadCount: number;
  createdAt: string;
};
