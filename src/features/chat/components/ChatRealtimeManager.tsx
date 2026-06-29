"use client";

import { type StompSubscription } from "@stomp/stompjs";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef } from "react";
import { useAuthState } from "@/features/auth/hooks/useAuthState";
import {
  applyIncomingChatMessage,
  parseIncomingChatMessageEvent,
  updateChatRoomLastMessage,
} from "@/features/chat/lib/chatMessageEvents";
import { myChatRoomsQueryOptions } from "@/features/chat/queries/chatQueries";
import { addStompConnectListener, getStompClient } from "@/features/chat/lib/stompClient";
import { useChatRealtimeStore } from "@/features/chat/stores/useChatRealtimeStore";

export default function ChatRealtimeManager() {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuthState();
  const roomsQuery = useQuery(myChatRoomsQueryOptions({ enabled: isAuthenticated }));
  const subscriptionsRef = useRef<Map<string, StompSubscription>>(new Map());
  const rooms = useMemo(() => roomsQuery.data?.rooms ?? [], [roomsQuery.data]);
  const roomsSignature = useMemo(
    () => rooms.map((room) => `${room.chatId}:${room.name}`).join("|"),
    [rooms],
  );

  useEffect(() => {
    const subscriptions = subscriptionsRef.current;

    if (!isAuthenticated) {
      subscriptions.forEach((subscription) => {
        subscription.unsubscribe();
      });
      subscriptions.clear();
      useChatRealtimeStore.getState().setSubscribedRoomIds([]);
      return;
    }

    const client = getStompClient();
    const roomMap = new Map(rooms.map((room) => [room.chatId, room]));

    const subscribeToRooms = (forceResubscribe: boolean) => {
      subscriptions.forEach((subscription, roomId) => {
        if (roomMap.has(roomId)) {
          return;
        }

        subscription.unsubscribe();
        subscriptions.delete(roomId);
      });

      if (!client.connected) {
        useChatRealtimeStore.getState().setSubscribedRoomIds(Array.from(roomMap.keys()));
        return;
      }

      roomMap.forEach((room, roomId) => {
        const currentSubscription = subscriptions.get(roomId);

        if (currentSubscription && !forceResubscribe) {
          return;
        }

        currentSubscription?.unsubscribe();

        const nextSubscription = client.subscribe(`/sub/chat/rooms/${roomId}`, (message) => {
          const event = parseIncomingChatMessageEvent(message);

          if (!event || event.roomId !== roomId) {
            return;
          }

          const { currentRoomId, showToast } = useChatRealtimeStore.getState();

          if (currentRoomId === roomId) {
            applyIncomingChatMessage(queryClient, roomId, event.message);
            updateChatRoomLastMessage(queryClient, roomId, event.message.text);
            return;
          }

          updateChatRoomLastMessage(queryClient, roomId, event.message.text, {
            incrementUnread: true,
          });
          showToast({
            roomName: room.name,
            senderName: event.message.senderName?.trim() || "알 수 없는 사용자",
            text: event.message.text,
          });
        });

        subscriptions.set(roomId, nextSubscription);
      });

      useChatRealtimeStore.getState().setSubscribedRoomIds(Array.from(roomMap.keys()));
    };

    subscribeToRooms(false);

    const removeConnectListener = addStompConnectListener(() => {
      subscribeToRooms(true);
    });

    return () => {
      removeConnectListener();
      subscriptions.forEach((subscription) => {
        subscription.unsubscribe();
      });
      subscriptions.clear();
      useChatRealtimeStore.getState().setSubscribedRoomIds([]);
    };
  }, [isAuthenticated, queryClient, roomsSignature, rooms]);

  return null;
}
