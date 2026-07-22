"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ChatRealtimeToast from "@/features/chat/components/ChatRealtimeToast";
import { useChatRealtimeStore } from "@/features/chat/stores/useChatRealtimeStore";

const TOAST_DURATION_MS = 3000;

export default function ChatRealtimeToastHost() {
  const router = useRouter();
  const toast = useChatRealtimeStore((state) => state.toasts[0] ?? null);
  const overflowCount = useChatRealtimeStore((state) => state.toastOverflowCount);
  const dismissCurrentToast = useChatRealtimeStore((state) => state.dismissCurrentToast);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (!toast || isPaused) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      dismissCurrentToast();
    }, TOAST_DURATION_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [dismissCurrentToast, isPaused, toast]);

  if (!toast) {
    return null;
  }

  return (
    <ChatRealtimeToast
      messageCount={toast.messageCount}
      overflowCount={overflowCount}
      roomName={toast.roomName}
      senderName={toast.senderName}
      text={toast.text}
      onClick={() => {
        dismissCurrentToast();
        setIsPaused(false);
        router.push(`/chats/${toast.roomId}`);
      }}
      onPauseChange={setIsPaused}
    />
  );
}
