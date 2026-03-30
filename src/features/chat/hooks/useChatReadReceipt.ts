"use client";

import { useEffect, useRef } from "react";
import { sendChatRead } from "@/features/chat/services/sendChatRead";

type UseChatReadReceiptParams = {
  roomId: string;
  lastConfirmedMessageId: string | null;
  targetElement: HTMLElement | null;
  scrollContainer: HTMLElement | null;
};

export function useChatReadReceipt({
  roomId,
  lastConfirmedMessageId,
  targetElement,
  scrollContainer,
}: UseChatReadReceiptParams) {
  const lastSentMessageIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!roomId || !lastConfirmedMessageId || !targetElement || !scrollContainer) {
      return;
    }

    const lastReadMessageId = Number(lastConfirmedMessageId);
    const numericRoomId = Number(roomId);

    if (Number.isNaN(lastReadMessageId) || Number.isNaN(numericRoomId)) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;

        if (!entry?.isIntersecting) {
          return;
        }

        if (lastSentMessageIdRef.current === lastConfirmedMessageId) {
          return;
        }

        sendChatRead({
          roomId: numericRoomId,
          lastReadMessageId,
        });

        lastSentMessageIdRef.current = lastConfirmedMessageId;
      },
      {
        root: scrollContainer,
        threshold: 0.6,
      },
    );

    observer.observe(targetElement);

    return () => {
      observer.disconnect();
    };
  }, [lastConfirmedMessageId, roomId, scrollContainer, targetElement]);
}
