"use client";

import { type IMessage, type StompSubscription } from "@stomp/stompjs";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { applyIncomingChatMessage, parseIncomingChatMessageEvent } from "@/features/chat/lib/chatMessageEvents";
import { addStompConnectListener, getStompClient } from "@/features/chat/lib/stompClient";

export function useChatRoomSubscription(roomId: string | null) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!roomId) {
      return;
    }

    const client = getStompClient();
    let subscription: StompSubscription | null = null;

    const handleIncomingMessage = (message: IMessage) => {
      const event = parseIncomingChatMessageEvent(message);

      if (!event || event.roomId !== roomId || !event.message) {
        return;
      }

      applyIncomingChatMessage(queryClient, roomId, event.message);
    };

    const subscribeToRoom = () => {
      subscription?.unsubscribe();
      subscription = client.subscribe(`/sub/chat/rooms/${roomId}`, handleIncomingMessage);
    };

    if (client.connected) {
      subscribeToRoom();
    }

    const removeConnectListener = addStompConnectListener(() => {
      subscribeToRoom();
    });

    return () => {
      removeConnectListener();
      subscription?.unsubscribe();
    };
  }, [queryClient, roomId]);
}
