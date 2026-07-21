import type { QueryClient } from "@tanstack/react-query";
import { resetChatRoomUnread } from "@/features/chat/lib/chatRoomCache";
import { sendChatRead } from "@/features/chat/services/sendChatRead";

type PendingReadReceipt = {
  ownerUserId: string;
  roomId: string;
  lastReadMessageId: string;
};

const pendingReadReceipts = new Map<string, PendingReadReceipt>();

function getReadReceiptKey(receipt: Pick<PendingReadReceipt, "ownerUserId" | "roomId">) {
  return `${receipt.ownerUserId}:${receipt.roomId}`;
}

function isNewerMessageId(nextMessageId: string, currentMessageId: string) {
  return Number(nextMessageId) > Number(currentMessageId);
}

function rememberLatestReadReceipt(receipt: PendingReadReceipt) {
  const receiptKey = getReadReceiptKey(receipt);
  const currentReceipt = pendingReadReceipts.get(receiptKey);

  if (
    !currentReceipt ||
    isNewerMessageId(receipt.lastReadMessageId, currentReceipt.lastReadMessageId)
  ) {
    pendingReadReceipts.set(receiptKey, receipt);
  }
}

function publishReadReceipt(queryClient: QueryClient, receipt: PendingReadReceipt) {
  sendChatRead({
    roomId: Number(receipt.roomId),
    lastReadMessageId: Number(receipt.lastReadMessageId),
  });

  const receiptKey = getReadReceiptKey(receipt);
  const pendingReceipt = pendingReadReceipts.get(receiptKey);

  if (pendingReceipt?.lastReadMessageId === receipt.lastReadMessageId) {
    pendingReadReceipts.delete(receiptKey);
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

export function flushPendingChatReads(queryClient: QueryClient, currentUserId: string) {
  const receipts = Array.from(pendingReadReceipts.values());

  receipts.forEach((receipt) => {
    if (receipt.ownerUserId !== currentUserId) {
      pendingReadReceipts.delete(getReadReceiptKey(receipt));
      return;
    }

    try {
      publishReadReceipt(queryClient, receipt);
    } catch {
      // Keep this and the remaining latest positions for the next reconnect.
    }
  });
}

export function clearPendingChatReads() {
  pendingReadReceipts.clear();
}
