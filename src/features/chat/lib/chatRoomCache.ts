import type { InfiniteData, QueryClient } from "@tanstack/react-query";
import {
  allMyChatRoomsQueryKey,
  myChatRoomsQueryKey,
  type MyChatRoomsResult,
} from "@/features/chat/queries/chatQueries";
import type { ChatRoom } from "@/features/chat/types";

type UpdateChatRoom = (room: ChatRoom) => ChatRoom;

function updateRooms(
  result: MyChatRoomsResult | undefined,
  roomId: string,
  updateRoom: UpdateChatRoom,
) {
  if (!result) {
    return result;
  }

  return {
    ...result,
    rooms: result.rooms.map((room) => (room.chatId === roomId ? updateRoom(room) : room)),
  } satisfies MyChatRoomsResult;
}

export function updateChatRoomCaches(
  queryClient: QueryClient,
  roomId: string,
  updateRoom: UpdateChatRoom,
) {
  queryClient.setQueriesData<MyChatRoomsResult>(
    {
      predicate: (query) =>
        query.queryKey[0] === myChatRoomsQueryKey[0] && query.queryKey[1] === "page",
    },
    (previousResult) => updateRooms(previousResult, roomId, updateRoom),
  );

  queryClient.setQueryData<InfiniteData<MyChatRoomsResult, number>>(
    allMyChatRoomsQueryKey,
    (previousData) =>
      previousData
        ? {
            ...previousData,
            pages: previousData.pages.map((page) => updateRooms(page, roomId, updateRoom) ?? page),
          }
        : previousData,
  );
}

export function resetChatRoomUnread(queryClient: QueryClient, roomId: string) {
  updateChatRoomCaches(queryClient, roomId, (room) => ({
    ...room,
    unreadCount: 0,
  }));
}
