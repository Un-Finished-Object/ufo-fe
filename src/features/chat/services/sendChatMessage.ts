import { publishStompMessage } from "@/features/chat/lib/stompClient";

export type SendChatMessageParams = {
  roomId: number;
  text: string;
  clientMessageId: string;
};

export function sendChatMessage({ roomId, text, clientMessageId }: SendChatMessageParams) {
  publishStompMessage({
    destination: "/pub/chat/message",
    body: JSON.stringify({
      roomId,
      text,
      clientMessageId,
    }),
  });
}
