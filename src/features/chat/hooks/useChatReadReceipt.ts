"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { publishOrQueueChatRead } from "@/features/chat/lib/chatReadReceiptQueue";

type UseChatReadReceiptParams = {
  ownerUserId: string | null;
  roomId: string;
  lastConfirmedMessageId: string | null;
  targetElement: HTMLElement | null;
  scrollContainer: HTMLElement | null;
};

export function useChatReadReceipt({
  ownerUserId,
  roomId,
  lastConfirmedMessageId,
  targetElement,
  scrollContainer,
}: UseChatReadReceiptParams) {
  const queryClient = useQueryClient();
  const lastSentMessageIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (
      !ownerUserId ||
      !roomId ||
      !lastConfirmedMessageId ||
      !targetElement ||
      !scrollContainer
    ) {
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

        const didPublish = publishOrQueueChatRead(queryClient, {
          ownerUserId,
          roomId: String(numericRoomId),
          lastReadMessageId: String(lastReadMessageId),
        });

        if (didPublish) {
          lastSentMessageIdRef.current = readKey;
        }
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
  }, [lastConfirmedMessageId, ownerUserId, queryClient, roomId, scrollContainer, targetElement]);
}
