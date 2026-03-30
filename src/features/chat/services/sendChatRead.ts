import { publishStompMessage } from "@/features/chat/lib/stompClient";

export type SendChatReadParams = {
  roomId: number;
  lastReadMessageId: number;
};

export function sendChatRead({ roomId, lastReadMessageId }: SendChatReadParams) {
  publishStompMessage({
    destination: "/pub/chat/read",
    body: JSON.stringify({
      roomId,
      lastReadMessageId,
    }),
  });
}
