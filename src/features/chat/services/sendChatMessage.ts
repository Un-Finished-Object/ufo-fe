import { publishStompMessage } from "@/features/chat/lib/stompClient";

export type SendChatMessageParams = {
  roomId: number;
  text: string;
  clientMessageId: string;
  replyMessageId?: number | null;
};

export function sendChatMessage({
  roomId,
  text,
  clientMessageId,
  replyMessageId = null,
}: SendChatMessageParams) {
  publishStompMessage({
    destination: "/pub/chat/message",
    body: JSON.stringify({
      roomId,
      text,
      clientMessageId,
      isReply: replyMessageId !== null,
      replyMessageId,
    }),
  });
}
