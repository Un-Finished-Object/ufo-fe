export type ChatMessage = {
  messageId: string | null;
  clientMessageId?: string;
  senderName?: string;
  replySenderName?: string | null;
  replyMessageId?: string | null;
  text: string;
  createdAt: string | null;
  deletedAt: string | null;
  status?: "pending" | "confirmed" | "failed";
};

export type ChatRoom = {
  chatId: string;
  patternId: string;
  name: string;
  nickname: string;
  imageUrl: string | null;
  lastMessage: string;
  favorite: boolean;
  isHidden: boolean;
  unreadCount: number;
  createdAt: string;
};
