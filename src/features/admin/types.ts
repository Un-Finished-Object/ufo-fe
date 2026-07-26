export type AdminChatRoom = {
  chatId: number;
  patternId: number;
  name: string;
  imageUrl: string | null;
  unreadCount: number;
  lastMessage: string;
  lastMessageDeleted?: boolean;
  lastMessageAt: string;
  createdAt: string;
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
