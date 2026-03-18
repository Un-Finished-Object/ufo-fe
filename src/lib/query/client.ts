import { QueryClient } from "@tanstack/react-query";

export const QUERY_STALE_TIME_MS = 30 * 60 * 1000;

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: QUERY_STALE_TIME_MS,
      },
    },
  });
}
