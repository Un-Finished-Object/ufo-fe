import type { QueryClient } from "@tanstack/react-query";
import { resetChatRoomUnread } from "@/features/chat/lib/chatRoomCache";
import { sendChatRead } from "@/features/chat/services/sendChatRead";

type PendingReadReceipt = {
  roomId: string;
  lastReadMessageId: string;
};

const pendingReadReceipts = new Map<string, PendingReadReceipt>();

function isNewerMessageId(nextMessageId: string, currentMessageId: string) {
  return Number(nextMessageId) > Number(currentMessageId);
}

function rememberLatestReadReceipt(receipt: PendingReadReceipt) {
  const currentReceipt = pendingReadReceipts.get(receipt.roomId);

  if (
    !currentReceipt ||
    isNewerMessageId(receipt.lastReadMessageId, currentReceipt.lastReadMessageId)
  ) {
    pendingReadReceipts.set(receipt.roomId, receipt);
  }
}

function publishReadReceipt(queryClient: QueryClient, receipt: PendingReadReceipt) {
  sendChatRead({
    roomId: Number(receipt.roomId),
    lastReadMessageId: Number(receipt.lastReadMessageId),
  });

  const pendingReceipt = pendingReadReceipts.get(receipt.roomId);

  if (pendingReceipt?.lastReadMessageId === receipt.lastReadMessageId) {
    pendingReadReceipts.delete(receipt.roomId);
  }

  resetChatRoomUnread(queryClient, receipt.roomId);
}

export function publishOrQueueChatRead(
  queryClient: QueryClient,
  receipt: PendingReadReceipt,
) {
  rememberLatestReadReceipt(receipt);

  try {
    publishReadReceipt(queryClient, receipt);
    return true;
  } catch {
    return false;
  }
}

export function flushPendingChatReads(queryClient: QueryClient) {
  const receipts = Array.from(pendingReadReceipts.values());

  receipts.forEach((receipt) => {
    try {
      publishReadReceipt(queryClient, receipt);
    } catch {
      // Keep this and the remaining latest positions for the next reconnect.
    }
  });
}
