"use client";

import { useEffect, useState, type ReactNode } from "react";
import { isMockMode } from "@/mocks/config";

type MockProviderProps = {
  children: ReactNode;
};

export default function MockProvider({ children }: MockProviderProps) {
  const mockEnabled = isMockMode();
  const [isReady, setIsReady] = useState(!mockEnabled);

  useEffect(() => {
    if (!mockEnabled) return;

    let active = true;

    async function startWorker() {
      const { worker } = await import("@/mocks/browser");
      await worker.start({
        onUnhandledRequest(request, print) {
          const url = new URL(request.url);
          if (url.pathname.startsWith("/v1/")) print.error();
        },
      });

      if (active) setIsReady(true);
    }

    void startWorker();

    return () => {
      active = false;
    };
  }, [mockEnabled]);

  if (!isReady) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-[430px] items-center justify-center bg-ufo-bg text-sm text-ufo-text-muted">
        Mock API를 준비하고 있어요.
      </div>
    );
  }

  return children;
}
