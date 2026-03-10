"use client";

import { create } from "zustand";
import type { ChatConnectionStatus } from "@/src/types/chat";

type ChatStoreState = {
  subscribedRoomIds: string[];
  currentRoomId: string | null;
  unreadCountByRoom: Record<string, number>;
  connectionStatus: ChatConnectionStatus;
};

type ChatStoreActions = {
  setCurrentRoomId: (roomId: string | null) => void;
  subscribeRoom: (roomId: string) => void;
  unsubscribeRoom: (roomId: string) => void;
  clearSubscribedRooms: () => void;
  setUnreadCount: (roomId: string, count: number) => void;
  incrementUnreadCount: (roomId: string) => void;
  resetUnreadCount: (roomId: string) => void;
  setConnectionStatus: (status: ChatConnectionStatus) => void;
};

export type ChatStore = ChatStoreState & ChatStoreActions;

export const chatStore = create<ChatStore>((set) => ({
  subscribedRoomIds: [],
  currentRoomId: null,
  unreadCountByRoom: {},
  connectionStatus: "idle",
  setCurrentRoomId: (roomId) => set({ currentRoomId: roomId }),
  subscribeRoom: (roomId) =>
    set((state) => {
      if (state.subscribedRoomIds.includes(roomId)) {
        return state;
      }

      return {
        subscribedRoomIds: [...state.subscribedRoomIds, roomId],
      };
    }),
  unsubscribeRoom: (roomId) =>
    set((state) => ({
      subscribedRoomIds: state.subscribedRoomIds.filter((subscribedRoomId) => subscribedRoomId !== roomId),
    })),
  clearSubscribedRooms: () => set({ subscribedRoomIds: [] }),
  setUnreadCount: (roomId, count) =>
    set((state) => ({
      unreadCountByRoom: {
        ...state.unreadCountByRoom,
        [roomId]: count,
      },
    })),
  incrementUnreadCount: (roomId) =>
    set((state) => ({
      unreadCountByRoom: {
        ...state.unreadCountByRoom,
        [roomId]: (state.unreadCountByRoom[roomId] ?? 0) + 1,
      },
    })),
  resetUnreadCount: (roomId) =>
    set((state) => ({
      unreadCountByRoom: {
        ...state.unreadCountByRoom,
        [roomId]: 0,
      },
    })),
  setConnectionStatus: (status) => set({ connectionStatus: status }),
}));
