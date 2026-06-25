import { QueryClient } from "@tanstack/react-query";

export const QUERY_STALE_TIME = {
  realtime: 0,
  critical: 15 * 1000,
  userState: 60 * 1000,
  dynamicList: 2 * 60 * 1000,
  personalized: 5 * 60 * 1000,
  reference: 10 * 60 * 1000,
} as const;

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: QUERY_STALE_TIME.realtime,
        refetchOnReconnect: true,
        refetchOnWindowFocus: true,
      },
    },
  });
}
