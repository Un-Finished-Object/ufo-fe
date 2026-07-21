"use client";

import { create } from "zustand";

type ChatRealtimeToast = {
  id: number;
  messageCount: number;
  roomId: string;
  roomName: string;
  senderName: string;
  text: string;
};

type ChatRealtimeState = {
  connectionStatus: "disconnected" | "connecting" | "connected";
  currentRoomId: string | null;
  subscribedRoomIds: string[];
  toasts: ChatRealtimeToast[];
  toastOverflowCount: number;
  setCurrentRoomId: (roomId: string | null) => void;
  clearCurrentRoomId: (roomId?: string | null) => void;
  setSubscribedRoomIds: (roomIds: string[]) => void;
  setConnectionStatus: (status: ChatRealtimeState["connectionStatus"]) => void;
  showToast: (toast: Omit<ChatRealtimeToast, "id" | "messageCount">) => void;
  dismissCurrentToast: () => void;
};

let toastId = 0;
const MAX_TOAST_QUEUE_SIZE = 3;

export const useChatRealtimeStore = create<ChatRealtimeState>((set) => ({
  connectionStatus: "disconnected",
  currentRoomId: null,
  subscribedRoomIds: [],
  toasts: [],
  toastOverflowCount: 0,
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
  setConnectionStatus: (connectionStatus) => {
    set({ connectionStatus });
  },
  showToast: (toast) => {
    toastId += 1;
    set((state) => {
      const lastToast = state.toasts.at(-1);

      if (lastToast?.roomId === toast.roomId) {
        return {
          toasts: [
            ...state.toasts.slice(0, -1),
            {
              ...lastToast,
              ...toast,
              id: toastId,
              messageCount: lastToast.messageCount + 1,
            },
          ],
        };
      }

      if (state.toasts.length >= MAX_TOAST_QUEUE_SIZE) {
        return { toastOverflowCount: state.toastOverflowCount + 1 };
      }

      return {
        toasts: [
          ...state.toasts,
          {
            id: toastId,
            messageCount: 1,
            ...toast,
          },
        ],
      };
    });
  },
  dismissCurrentToast: () => {
    set((state) => {
      const nextToasts = state.toasts.slice(1);

      return {
        toasts: nextToasts,
        toastOverflowCount: nextToasts.length === 0 ? 0 : state.toastOverflowCount,
      };
    });
  },
}));
