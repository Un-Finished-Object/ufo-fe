"use client";

import { useQuery } from "@tanstack/react-query";
import { walletQueryOptions } from "@/features/auth/queries/userQueries";

type UseWalletQueryOptions = {
  enabled?: boolean;
};

export function useWalletQuery({ enabled = true }: UseWalletQueryOptions = {}) {
  return useQuery({
    ...walletQueryOptions(),
    enabled,
  });
}
