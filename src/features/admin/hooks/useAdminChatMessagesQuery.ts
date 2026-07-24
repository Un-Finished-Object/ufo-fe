"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import { adminChatMessagesQueryOptions } from "@/features/admin/queries/adminChatQueries";
import { flattenChatMessagesData } from "@/features/chat/hooks/useChatMessagesQuery";

type EntryLastReadState = {
  chatId: number;
  messageId: string | null;
};

export function useAdminChatMessagesQuery(chatId: number) {
  const [entryLastReadState, setEntryLastReadState] = useState<EntryLastReadState | null>(null);

  const captureInitialPage = useCallback((lastReadMessageId: string | null) => {
    setEntryLastReadState((current) =>
      current?.chatId === chatId
        ? current
        : { chatId, messageId: lastReadMessageId },
    );
  }, [chatId]);

  const query = useInfiniteQuery(
    adminChatMessagesQueryOptions(chatId, captureInitialPage),
  );
  const messages = useMemo(
    () => flattenChatMessagesData(query.data),
    [query.data],
  );

  const resetEntryLastReadMessageId = useCallback(() => {
    setEntryLastReadState(null);
  }, []);

  return {
    ...query,
    messages,
    entryLastReadMessageId:
      entryLastReadState?.chatId === chatId ? entryLastReadState.messageId : null,
    hasCapturedEntryLastReadMessageId: entryLastReadState?.chatId === chatId,
    resetEntryLastReadMessageId,
  };
}
