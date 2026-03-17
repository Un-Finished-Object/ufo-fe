export type ChatMessage = {
  messageId: string | null;
  clientMessageId?: string;
  senderId?: string | null;
  senderName?: string;
  text: string;
  createdAt: string | null;
  status?: "pending" | "confirmed";
};
