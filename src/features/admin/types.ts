export type AdminChatMessage = {
  id: number;
  senderId: number;
  senderName: string;
  text: string;
  createdAt: string;
  replySenderName: string | null;
  replyMessageId: number | null;
};

export type AdminChatRoom = {
  chatId: number;
  patternId: number;
  name: string;
  imageUrl: string | null;
  unreadCount: number;
  lastMessage: string;
  lastMessageAt: string;
  createdAt: string;
};

export type AdminChatMessagePage = {
  chatId: number;
  patternId: number;
  chatName: string;
  chatCreatedAt: string;
  lastMessageId: number | null;
  hasNext: boolean;
  nextMessageId: number | null;
  messages: AdminChatMessage[];
};

export type AdminAlternativeComment = {
  commentId: number;
  altSetId: number;
  patternId: number;
  patternTitle: string;
  content: string;
  username: string;
  createdAt: string;
  isMine: boolean;
};
