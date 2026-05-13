"use client";

import { useEffect } from "react";
import ChatRealtimeToast from "@/features/chat/components/ChatRealtimeToast";
import { useChatRealtimeStore } from "@/features/chat/stores/useChatRealtimeStore";

const TOAST_DURATION_MS = 3000;

export default function ChatRealtimeToastHost() {
  const toast = useChatRealtimeStore((state) => state.toast);
  const clearToast = useChatRealtimeStore((state) => state.clearToast);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      clearToast();
    }, TOAST_DURATION_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [clearToast, toast]);

  if (!toast) {
    return null;
  }

  return (
    <ChatRealtimeToast
      roomName={toast.roomName}
      senderName={toast.senderName}
      text={toast.text}
    />
  );
}
