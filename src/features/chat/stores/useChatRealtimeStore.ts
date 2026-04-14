"use client";

import { create } from "zustand";

type ChatRealtimeToast = {
  id: number;
  roomName: string;
  senderName: string;
  text: string;
};

type ChatRealtimeState = {
  currentRoomId: string | null;
  subscribedRoomIds: string[];
  toast: ChatRealtimeToast | null;
  setCurrentRoomId: (roomId: string | null) => void;
  clearCurrentRoomId: (roomId?: string | null) => void;
  setSubscribedRoomIds: (roomIds: string[]) => void;
  showToast: (toast: Omit<ChatRealtimeToast, "id">) => void;
  clearToast: () => void;
};

let toastId = 0;

export const useChatRealtimeStore = create<ChatRealtimeState>((set) => ({
  currentRoomId: null,
  subscribedRoomIds: [],
  toast: null,
  setCurrentRoomId: (roomId) => {
    set({ currentRoomId: roomId });
  },
  clearCurrentRoomId: (roomId) => {
    set((state) => ({
      currentRoomId:
        typeof roomId === "undefined" || state.currentRoomId === roomId ? null : state.currentRoomId,
    }));
  },
  setSubscribedRoomIds: (roomIds) => {
    set({ subscribedRoomIds: roomIds });
  },
  showToast: (toast) => {
    toastId += 1;
    set({
      toast: {
        id: toastId,
        ...toast,
      },
    });
  },
  clearToast: () => {
    set({ toast: null });
  },
}));
