export type ChatConnectionStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "disconnected";

export type ChatMessage = {
  messageId: string;
  senderId: string;
  text: string;
  createdAt: string;
};
