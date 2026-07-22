"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import {
  allMyChatRoomsInfiniteQueryOptions,
  flattenMyChatRooms,
} from "@/features/chat/queries/chatQueries";

export function useAllMyChatRoomsQuery({ enabled = true }: { enabled?: boolean } = {}) {
  const query = useInfiniteQuery(allMyChatRoomsInfiniteQueryOptions({ enabled }));
  const { fetchNextPage, hasNextPage, isFetchingNextPage } = query;

  useEffect(() => {
    if (!enabled || !hasNextPage || isFetchingNextPage) {
      return;
    }

    void fetchNextPage();
  }, [enabled, fetchNextPage, hasNextPage, isFetchingNextPage]);

  const rooms = useMemo(
    () => flattenMyChatRooms(query.data as Parameters<typeof flattenMyChatRooms>[0]),
    [query.data],
  );

  return {
    ...query,
    rooms,
  };
}
