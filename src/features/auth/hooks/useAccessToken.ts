"use client";

import { useSyncExternalStore } from "react";
import { getAccessToken, subscribeAccessToken } from "@/lib/auth/accessToken";

export function useAccessToken() {
  return useSyncExternalStore(subscribeAccessToken, getAccessToken, () => null);
}
