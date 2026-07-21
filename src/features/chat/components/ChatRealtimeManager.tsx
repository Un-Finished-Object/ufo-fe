"use client";

import { type StompSubscription } from "@stomp/stompjs";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef } from "react";
import { useAuthState } from "@/features/auth/hooks/useAuthState";
import { useAllMyChatRoomsQuery } from "@/features/chat/hooks/useAllMyChatRoomsQuery";
import {
  applyIncomingChatMessage,
  parseIncomingChatMessageEvent,
  updateChatRoomLastMessage,
} from "@/features/chat/lib/chatMessageEvents";
import { addStompConnectListener, getStompClient } from "@/features/chat/lib/stompClient";
import { useChatRealtimeStore } from "@/features/chat/stores/useChatRealtimeStore";
import { flushPendingChatReads } from "@/features/chat/lib/chatReadReceiptQueue";

export default function ChatRealtimeManager() {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuthState();
  const roomsQuery = useAllMyChatRoomsQuery({ enabled: isAuthenticated });
  const subscriptionsRef = useRef<Map<string, StompSubscription>>(new Map());
  const rooms = roomsQuery.rooms;
  const roomMetadataRef = useRef(new Map(rooms.map((room) => [room.chatId, room])));
  const roomIds = useMemo(() => rooms.map((room) => room.chatId), [rooms]);
  const roomIdsSignature = roomIds.join("|");

  useEffect(() => {
    roomMetadataRef.current = new Map(rooms.map((room) => [room.chatId, room]));
  }, [rooms]);

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
    const subscribedRoomIds = roomIdsSignature ? roomIdsSignature.split("|") : [];
    const nextRoomIds = new Set(subscribedRoomIds);

    const subscribeToRooms = (
      connectedClient: ReturnType<typeof getStompClient>,
      forceResubscribe: boolean,
    ) => {
      subscriptions.forEach((subscription, roomId) => {
        if (nextRoomIds.has(roomId)) {
          return;
        }

        subscription.unsubscribe();
        subscriptions.delete(roomId);
      });

      if (!connectedClient.connected) {
        useChatRealtimeStore.getState().setSubscribedRoomIds([]);
        return;
      }

      subscribedRoomIds.forEach((roomId) => {
        const currentSubscription = subscriptions.get(roomId);

        if (currentSubscription && !forceResubscribe) {
          return;
        }

        currentSubscription?.unsubscribe();

        const nextSubscription = connectedClient.subscribe(`/sub/chat/rooms/${roomId}`, (message) => {
          const event = parseIncomingChatMessageEvent(message);

          if (!event || event.roomId !== roomId) {
            return;
          }

          const { currentRoomId, showToast } = useChatRealtimeStore.getState();
          const roomMetadata = roomMetadataRef.current.get(roomId);

          if (!roomMetadata) {
            return;
          }

          const isMine = event.message.senderName?.trim() === roomMetadata.nickname.trim();

          if (currentRoomId === roomId) {
            applyIncomingChatMessage(queryClient, roomId, event.message);
            updateChatRoomLastMessage(queryClient, roomId, event.message.text);
            return;
          }

          if (isMine) {
            updateChatRoomLastMessage(queryClient, roomId, event.message.text);
            return;
          }

          updateChatRoomLastMessage(queryClient, roomId, event.message.text, {
            incrementUnread: true,
          });
          showToast({
            roomId,
            roomName: roomMetadata.name,
            senderName: event.message.senderName?.trim() || "알 수 없는 사용자",
            text: event.message.text,
          });
        });

        subscriptions.set(roomId, nextSubscription);
      });

      useChatRealtimeStore.getState().setSubscribedRoomIds(Array.from(subscriptions.keys()));
    };

    subscribeToRooms(client, false);

    const removeConnectListener = addStompConnectListener((_frame, connectedClient) => {
      subscribeToRooms(connectedClient, true);
      flushPendingChatReads(queryClient);
    });

    return () => {
      removeConnectListener();
      subscriptions.forEach((subscription) => {
        subscription.unsubscribe();
      });
      subscriptions.clear();
      useChatRealtimeStore.getState().setSubscribedRoomIds([]);
    };
  }, [isAuthenticated, queryClient, roomIdsSignature]);

  return null;
}
