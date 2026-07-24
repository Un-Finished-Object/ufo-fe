"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import BackIcon from "@/components/icons/BackIcon";
import StateBlock from "@/components/common/StateBlock";
import YesOrNo from "@/components/dialogs/YesOrNo";
import AdminChatLastReadSeparator from "@/features/admin/components/AdminChatLastReadSeparator";
import AdminRefreshButton from "@/features/admin/components/AdminRefreshButton";
import { useAdminChatMessagesQuery } from "@/features/admin/hooks/useAdminChatMessagesQuery";
import { adminRoutes } from "@/features/admin/lib/adminRoutes";
import {
  adminChatQueryKeys,
  deleteAdminChatMessage,
} from "@/features/admin/queries/adminChatQueries";
import { readAdminChatMessage } from "@/features/admin/services/readAdminChatMessage";
import {
  flattenChatMessagesData,
  type ChatMessagesInfiniteData,
} from "@/features/chat/hooks/useChatMessagesQuery";

function formatDate(value: string | null) {
  if (!value) return "날짜 미상";
  return new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "long", day: "numeric", weekday: "short" }).format(new Date(value));
}

function formatTime(value: string | null) {
  if (!value) return "시간 미상";
  return new Intl.DateTimeFormat("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(value));
}

export default function AdminChatHistoryScreen({ chatId }: { chatId: number }) {
  const queryClient = useQueryClient();
  const messagesQuery = useAdminChatMessagesQuery(chatId);
  const messages = messagesQuery.messages;
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(null);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [readFeedback, setReadFeedback] = useState<string | null>(null);
  const [initialPositionFeedback, setInitialPositionFeedback] = useState<string | null>(null);
  const [isPreparingInitialPosition, setIsPreparingInitialPosition] = useState(true);
  const scrollContainerRef = useRef<HTMLElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const loadOlderSentinelRef = useRef<HTMLDivElement>(null);
  const lastReadMarkerRef = useRef<HTMLDivElement>(null);
  const previousScrollHeightRef = useRef<number | null>(null);
  const didInitialScrollRef = useRef(false);
  const isPositioningInitialMessageRef = useRef(false);
  const initialPositionOperationRef = useRef(0);
  const initialScrollTargetRef = useRef<"last-read" | "latest" | null>(null);
  const participantCount = new Set(
    messages.map((message) => message.senderName?.trim()).filter(Boolean),
  ).size;

  const deleteMutation = useMutation({
    mutationFn: (messageId: string) => deleteAdminChatMessage(chatId, Number(messageId)),
    onSuccess: async (result, messageId) => {
      queryClient.setQueryData<ChatMessagesInfiniteData>(
        adminChatQueryKeys.messages(chatId),
        (previous) => previous ? {
          ...previous,
          pages: previous.pages.map((page) => ({
            ...page,
            messages: page.messages.map((message) =>
              message.messageId === messageId
                ? { ...message, deletedAt: result.deletedAt }
                : message,
            ),
          })),
        } : previous,
      );
      setSelectedMessageId((current) => current === messageId ? null : current);
      setDeletingMessageId(null);
      await queryClient.invalidateQueries({ queryKey: [...adminChatQueryKeys.root, "list"] });
    },
  });

  const readMutation = useMutation({
    mutationFn: (messageId: string) => readAdminChatMessage(chatId, Number(messageId)),
    onMutate: () => {
      setReadFeedback(null);
    },
    onSuccess: async (_, messageId) => {
      setSelectedMessageId((current) => current === messageId ? null : current);
      setReadFeedback("메시지를 확인했습니다.");
      await queryClient.invalidateQueries({ queryKey: [...adminChatQueryKeys.root, "list"] });
    },
    onError: () => {
      setReadFeedback("메시지를 확인하지 못했습니다. 다시 시도해 주세요.");
    },
  });

  const handleLoadOlder = useCallback(async () => {
    if (
      isPreparingInitialPosition ||
      !messagesQuery.hasNextPage ||
      messagesQuery.isFetchingNextPage
    ) return;
    previousScrollHeightRef.current = scrollContainerRef.current?.scrollHeight ?? null;
    await messagesQuery.fetchNextPage();
    window.requestAnimationFrame(() => {
      const container = scrollContainerRef.current;
      const previousHeight = previousScrollHeightRef.current;
      if (container && previousHeight !== null) {
        container.scrollTop += container.scrollHeight - previousHeight;
      }
      previousScrollHeightRef.current = null;
    });
  }, [isPreparingInitialPosition, messagesQuery]);

  const handleRefresh = useCallback(async () => {
    initialPositionOperationRef.current += 1;
    isPositioningInitialMessageRef.current = false;
    didInitialScrollRef.current = false;
    initialScrollTargetRef.current = null;
    setIsPreparingInitialPosition(true);
    setInitialPositionFeedback(null);
    setSelectedMessageId(null);
    setReadFeedback(null);
    messagesQuery.resetEntryLastReadMessageId();
    await queryClient.resetQueries({ queryKey: adminChatQueryKeys.messages(chatId), exact: true });
  }, [chatId, messagesQuery, queryClient]);

  useEffect(() => {
    if (
      messagesQuery.isPending ||
      messagesQuery.isError ||
      !messagesQuery.hasCapturedEntryLastReadMessageId ||
      didInitialScrollRef.current ||
      isPositioningInitialMessageRef.current
    ) {
      return;
    }

    const operationId = ++initialPositionOperationRef.current;
    const entryLastReadMessageId = messagesQuery.entryLastReadMessageId;
    isPositioningInitialMessageRef.current = true;

    const finishPositioning = (
      target: "last-read" | "latest",
      feedback: string | null = null,
    ) => {
      if (initialPositionOperationRef.current !== operationId) return;

      initialScrollTargetRef.current = target;
      setInitialPositionFeedback(feedback);
      isPositioningInitialMessageRef.current = false;
      setIsPreparingInitialPosition(false);
    };

    const locateInitialMessage = async () => {
      if (!entryLastReadMessageId) {
        finishPositioning("latest");
        return;
      }

      if (messages.some((message) => message.messageId === entryLastReadMessageId)) {
        finishPositioning("last-read");
        return;
      }

      let canFetchMore = messagesQuery.hasNextPage === true;

      try {
        while (canFetchMore && initialPositionOperationRef.current === operationId) {
          const result = await messagesQuery.fetchNextPage();
          const nextMessages = flattenChatMessagesData(result.data);

          if (nextMessages.some((message) => message.messageId === entryLastReadMessageId)) {
            finishPositioning("last-read");
            return;
          }

          canFetchMore = result.hasNextPage === true;
        }

        finishPositioning(
          "latest",
          "마지막으로 읽은 메시지를 찾지 못해 최근 메시지부터 표시합니다.",
        );
      } catch {
        finishPositioning(
          "latest",
          "이전 메시지를 불러오지 못해 최근 메시지부터 표시합니다.",
        );
      }
    };

    void locateInitialMessage();
  }, [messages, messagesQuery]);

  useLayoutEffect(() => {
    if (isPreparingInitialPosition || didInitialScrollRef.current) return;

    const container = scrollContainerRef.current;

    if (!container) return;

    if (initialScrollTargetRef.current === "last-read" && lastReadMarkerRef.current) {
      const markerRect = lastReadMarkerRef.current.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const toolbarHeight = toolbarRef.current?.getBoundingClientRect().height ?? 0;
      const targetTop =
        markerRect.top - containerRect.top + container.scrollTop - toolbarHeight - 12;

      container.scrollTop = Math.max(targetTop, 0);
    } else {
      container.scrollTop = container.scrollHeight;
    }

    didInitialScrollRef.current = true;
    initialScrollTargetRef.current = null;
  }, [isPreparingInitialPosition, messages.length]);

  useEffect(() => {
    const root = scrollContainerRef.current;
    const target = loadOlderSentinelRef.current;
    if (!root || !target || isPreparingInitialPosition) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) void handleLoadOlder();
      },
      { root, rootMargin: "80px 0px 0px" },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [handleLoadOlder, isPreparingInitialPosition, messagesQuery.hasNextPage]);

  return (
    <div className="flex h-[calc(100dvh-4rem)] min-h-0 flex-col overflow-hidden px-4 py-5 md:px-8 md:py-8">
      <div className="mb-5 flex shrink-0 items-end justify-between gap-4">
        <div className="flex min-w-0 items-center gap-2">
          <Link href={adminRoutes.chat} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-ufo-divider bg-ufo-surface text-ufo-brand" aria-label="채팅방 목록으로 돌아가기">
            <BackIcon className="h-5 w-5" />
          </Link>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-ufo-brand">채팅 상세</p>
            <h2 className="truncate text-xl font-bold tracking-tight text-ufo-text">채팅방 {chatId}</h2>
          </div>
        </div>
        <AdminRefreshButton onRefresh={() => void handleRefresh()} isRefreshing={messagesQuery.isRefetching} />
      </div>

      {messagesQuery.isPending ? (
        <div className="flex min-h-0 flex-1 items-center justify-center rounded-2xl border border-ufo-divider bg-ufo-surface">
          <StateBlock type="loading" title="채팅 내역을 불러오고 있어요." className="px-4 py-12" />
        </div>
      ) : messagesQuery.isError ? (
        <div className="flex min-h-0 flex-1 items-center justify-center rounded-2xl border border-ufo-divider bg-ufo-surface">
          <StateBlock type="error" title="채팅 내역을 불러오지 못했어요." description="잠시 후 다시 시도해 주세요." actionLabel="다시 시도" onAction={() => void handleRefresh()} className="px-4 py-12" />
        </div>
      ) : isPreparingInitialPosition ? (
        <div className="flex min-h-0 flex-1 items-center justify-center rounded-2xl border border-ufo-divider bg-ufo-surface">
          <StateBlock type="loading" title="마지막으로 읽은 메시지를 찾고 있어요." className="px-4 py-12" />
        </div>
      ) : (
        <div className="grid min-h-0 flex-1 gap-5 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-stretch">
          <aside className="shrink-0 rounded-2xl border border-ufo-divider bg-ufo-surface px-4 py-4 lg:self-start">
            <p className="text-xs font-semibold text-ufo-brand">관리자 모니터링 화면</p>
            <p className="mt-1 text-xs leading-5 text-ufo-text-subtle">채팅방 {chatId}</p>
            <p className="text-xs leading-5 text-ufo-text-subtle">메시지 {messages.length}개 · 현재 로딩된 참여자 {participantCount}명</p>
          </aside>

          <section ref={scrollContainerRef} className="min-h-0 overflow-y-auto overscroll-contain rounded-2xl border border-ufo-divider bg-ufo-surface px-4 py-5 md:px-6" aria-label={`채팅방 ${chatId} 전체 채팅 내역`}>
            <div ref={toolbarRef} className="sticky top-0 z-10 mb-4 flex min-h-12 items-center justify-between gap-3 rounded-xl border border-ufo-divider bg-ufo-surface/95 px-3 py-2 shadow-sm backdrop-blur">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-ufo-text-secondary">
                  {selectedMessageId ? `메시지 ${selectedMessageId} 선택됨` : "확인할 메시지를 선택해 주세요."}
                </p>
                {readFeedback || initialPositionFeedback ? <p className="mt-0.5 text-[11px] text-ufo-text-subtle" role="status">{readFeedback ?? initialPositionFeedback}</p> : null}
              </div>
              <button
                type="button"
                onClick={() => selectedMessageId && readMutation.mutate(selectedMessageId)}
                disabled={!selectedMessageId || readMutation.isPending}
                className="min-h-9 shrink-0 rounded-lg bg-ufo-brand px-3 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:bg-ufo-text-muted"
              >
                {readMutation.isPending ? "확인 중" : "메시지 확인"}
              </button>
            </div>

            <div ref={loadOlderSentinelRef} className="flex min-h-8 items-center justify-center" aria-live="polite">
              {messagesQuery.isFetchingNextPage ? (
                <span className="text-xs text-ufo-text-muted">이전 메시지를 불러오고 있어요.</span>
              ) : messagesQuery.hasNextPage ? (
                <button type="button" onClick={() => void handleLoadOlder()} className="min-h-8 px-3 text-xs font-semibold text-ufo-brand">이전 메시지 불러오기</button>
              ) : messages.length > 0 ? (
                <span className="text-xs text-ufo-text-muted">첫 메시지입니다.</span>
              ) : null}
            </div>

            {messages.length > 0 ? (
              <ol className="space-y-4">
                {messages.map((message, index) => {
                  const date = formatDate(message.createdAt);
                  const previousMessage = messages[index - 1];
                  const showDate = !previousMessage || date !== formatDate(previousMessage.createdAt);
                  const messageId = message.messageId;
                  const senderName = message.senderName?.trim() || "사용자";
                  const isDeleted = message.deletedAt !== null;
                  const isLastReadMessage =
                    messageId !== null &&
                    messageId === messagesQuery.entryLastReadMessageId;

                  return (
                    <li key={messageId ?? message.clientMessageId ?? message.createdAt}>
                      {showDate ? <div className="my-5 flex items-center gap-3"><span className="h-px flex-1 bg-ufo-divider" /><time className="text-[11px] text-ufo-text-dim">{date}</time><span className="h-px flex-1 bg-ufo-divider" /></div> : null}
                      {isLastReadMessage ? <AdminChatLastReadSeparator ref={lastReadMarkerRef} /> : null}
                      <article className="flex items-start gap-3">
                        {messageId ? (
                          <input
                            type="checkbox"
                            checked={selectedMessageId === messageId}
                            onChange={() => {
                              setReadFeedback(null);
                              setSelectedMessageId((current) => current === messageId ? null : messageId);
                            }}
                            disabled={readMutation.isPending}
                            className="mt-2 h-5 w-5 shrink-0 accent-ufo-brand"
                            aria-label={`${senderName}님의 ${formatTime(message.createdAt)} 메시지 선택`}
                          />
                        ) : null}
                        <div className="min-w-0 flex-1">
                          {isDeleted ? (
                            <div className="rounded-xl bg-ufo-bg px-3 py-2.5">
                              <p className="text-sm text-ufo-text-subtle">관리자가 삭제한 메시지입니다</p>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex min-w-0 items-baseline gap-2"><p className="truncate text-sm font-semibold text-ufo-text-secondary">{senderName}</p><time dateTime={message.createdAt ?? undefined} className="shrink-0 text-[11px] text-ufo-text-dim">{formatTime(message.createdAt)}</time></div>
                                {messageId ? <button type="button" onClick={() => { deleteMutation.reset(); setDeletingMessageId(messageId); }} className="min-h-8 shrink-0 rounded-lg px-2 text-xs font-semibold text-ufo-error" aria-label={`${senderName}님의 ${formatTime(message.createdAt)} 메시지 삭제`}>삭제</button> : null}
                              </div>
                              <div className="mt-1 rounded-xl rounded-tl-sm bg-ufo-bg px-3 py-2.5">
                                {message.replyMessageId !== null ? (
                                  <p className="mb-2 border-l-2 border-ufo-brand pl-2 text-[11px] leading-4 text-ufo-text-subtle">{message.replySenderName ?? "사용자"}님의 메시지에 답장 · 메시지 {message.replyMessageId}</p>
                                ) : null}
                                <p className="whitespace-pre-wrap break-words text-sm leading-6 text-ufo-text">{message.text}</p>
                              </div>
                            </>
                          )}
                        </div>
                      </article>
                    </li>
                  );
                })}
              </ol>
            ) : (
              <p className="py-12 text-center text-sm text-ufo-text-subtle">표시할 채팅 메시지가 없습니다.</p>
            )}
          </section>
        </div>
      )}

      {deletingMessageId !== null ? (
        <YesOrNo
          mainText="채팅 메시지를 삭제할까요?"
          subText={deleteMutation.isError ? "메시지를 삭제하지 못했어요. 다시 시도해 주세요." : "삭제한 메시지는 복구할 수 없어요."}
          yesLabel={deleteMutation.isPending ? "삭제 중" : "삭제"}
          noLabel="취소"
          yesDisabled={deleteMutation.isPending}
          noDisabled={deleteMutation.isPending}
          onYes={() => deleteMutation.mutate(deletingMessageId)}
          onNo={() => { deleteMutation.reset(); setDeletingMessageId(null); }}
        />
      ) : null}
    </div>
  );
}
