"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { resetChatRoomUnread } from "@/features/chat/lib/chatRoomCache";
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
  const queryClient = useQueryClient();
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

        const readKey = `${roomId}:${lastConfirmedMessageId}`;

        if (lastSentMessageIdRef.current === readKey) {
          return;
        }

        sendChatRead({
          roomId: numericRoomId,
          lastReadMessageId,
        });

        resetChatRoomUnread(queryClient, roomId);
        lastSentMessageIdRef.current = readKey;
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
  }, [lastConfirmedMessageId, queryClient, roomId, scrollContainer, targetElement]);
}
