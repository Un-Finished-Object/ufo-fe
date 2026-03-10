"use client";

import { useEffect, type ReactNode } from "react";
import { chatStore } from "@/src/stores/chatStore";

type ChatConnectionProviderProps = {
  children: ReactNode;
};

export default function ChatConnectionProvider({ children }: ChatConnectionProviderProps) {
  const setConnectionStatus = chatStore((state) => state.setConnectionStatus);

  useEffect(() => {
    setConnectionStatus("connecting");

    const timeoutId = window.setTimeout(() => {
      setConnectionStatus("connected");
    }, 300);

    return () => {
      window.clearTimeout(timeoutId);
      setConnectionStatus("disconnected");
    };
  }, [setConnectionStatus]);

  return <>{children}</>;
}
