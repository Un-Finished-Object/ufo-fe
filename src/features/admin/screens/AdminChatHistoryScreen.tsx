"use client";

import { useInfiniteQuery, useMutation, useQueryClient, type InfiniteData } from "@tanstack/react-query";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import BackIcon from "@/components/icons/BackIcon";
import StateBlock from "@/components/common/StateBlock";
import YesOrNo from "@/components/dialogs/YesOrNo";
import AdminRefreshButton from "@/features/admin/components/AdminRefreshButton";
import {
  adminChatMessagesQueryOptions,
  adminChatQueryKeys,
  deleteAdminChatMessage,
} from "@/features/admin/queries/adminChatQueries";
import type { AdminChatMessage, AdminChatMessagePage } from "@/features/admin/types";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "long", day: "numeric", weekday: "short" }).format(new Date(value));
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(value));
}

export default function AdminChatHistoryScreen({ chatId }: { chatId: number }) {
  const queryClient = useQueryClient();
  const messagesQuery = useInfiniteQuery(adminChatMessagesQueryOptions(chatId));
  const [deletingMessageId, setDeletingMessageId] = useState<number | null>(null);
  const scrollContainerRef = useRef<HTMLElement>(null);
  const loadOlderSentinelRef = useRef<HTMLDivElement>(null);
  const previousScrollHeightRef = useRef<number | null>(null);
  const didInitialScrollRef = useRef(false);
  const metadata = messagesQuery.data?.pages[0];
  const messages = useMemo(() => {
    const messageMap = new Map<number, AdminChatMessage>();
    for (const page of [...(messagesQuery.data?.pages ?? [])].reverse()) {
      for (const message of page.messages) messageMap.set(message.id, message);
    }
    return [...messageMap.values()].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
  }, [messagesQuery.data?.pages]);
  const participantCount = new Set(messages.map((message) => message.senderId)).size;

  const deleteMutation = useMutation({
    mutationFn: (messageId: number) => deleteAdminChatMessage(chatId, messageId),
    onSuccess: async (_, messageId) => {
      queryClient.setQueryData<InfiniteData<AdminChatMessagePage, number | null>>(
        adminChatQueryKeys.messages(chatId),
        (previous) => previous ? {
          ...previous,
          pages: previous.pages.map((page) => ({
            ...page,
            messages: page.messages.filter((message) => message.id !== messageId),
          })),
        } : previous,
      );
      setDeletingMessageId(null);
      await queryClient.invalidateQueries({ queryKey: [...adminChatQueryKeys.root, "list"] });
    },
  });

  const handleLoadOlder = useCallback(async () => {
    if (!messagesQuery.hasNextPage || messagesQuery.isFetchingNextPage) return;
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
  }, [messagesQuery]);

  const handleRefresh = useCallback(async () => {
    didInitialScrollRef.current = false;
    await queryClient.resetQueries({ queryKey: adminChatQueryKeys.messages(chatId), exact: true });
  }, [chatId, queryClient]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || didInitialScrollRef.current || messagesQuery.isPending || messages.length === 0) return;
    container.scrollTop = container.scrollHeight;
    didInitialScrollRef.current = true;
  }, [messages.length, messagesQuery.isPending]);

  useEffect(() => {
    const root = scrollContainerRef.current;
    const target = loadOlderSentinelRef.current;
    if (!root || !target) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) void handleLoadOlder();
      },
      { root, rootMargin: "80px 0px 0px" },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [handleLoadOlder, messagesQuery.hasNextPage]);

  return (
    <div className="flex h-[calc(100dvh-4rem)] min-h-0 flex-col overflow-hidden px-4 py-5 md:px-8 md:py-8">
      <div className="mb-5 flex shrink-0 items-end justify-between gap-4">
        <div className="flex min-w-0 items-center gap-2">
          <Link href="/admin/chats" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-ufo-divider bg-ufo-surface text-ufo-brand" aria-label="채팅방 목록으로 돌아가기">
            <BackIcon className="h-5 w-5" />
          </Link>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-ufo-brand">채팅 상세</p>
            <h2 className="truncate text-xl font-bold tracking-tight text-ufo-text">{metadata?.chatName ?? `채팅방 ${chatId}`}</h2>
          </div>
        </div>
        <AdminRefreshButton onRefresh={() => void handleRefresh()} isRefreshing={messagesQuery.isRefetching} />
      </div>

      {messagesQuery.isPending ? (
        <div className="flex min-h-0 flex-1 items-center justify-center rounded-2xl border border-ufo-divider bg-ufo-surface">
          <StateBlock type="loading" title="채팅 내역을 불러오고 있어요." className="px-4 py-12" />
        </div>
      ) : messagesQuery.isError || !metadata ? (
        <div className="flex min-h-0 flex-1 items-center justify-center rounded-2xl border border-ufo-divider bg-ufo-surface">
          <StateBlock type="error" title="채팅 내역을 불러오지 못했어요." description="잠시 후 다시 시도해 주세요." actionLabel="다시 시도" onAction={() => void messagesQuery.refetch()} className="px-4 py-12" />
        </div>
      ) : (
        <div className="grid min-h-0 flex-1 gap-5 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-stretch">
          <aside className="shrink-0 rounded-2xl border border-ufo-divider bg-ufo-surface px-4 py-4 lg:self-start">
            <p className="text-xs font-semibold text-ufo-brand">관리자 모니터링 화면</p>
            <p className="mt-1 text-xs leading-5 text-ufo-text-subtle">채팅방 {metadata.chatId} · 도안 {metadata.patternId}</p>
            <p className="text-xs leading-5 text-ufo-text-subtle">메시지 {messages.length}개 · 현재 로딩된 참여자 {participantCount}명</p>
            <p className="text-xs leading-5 text-ufo-text-subtle">생성 {formatDate(metadata.chatCreatedAt)}</p>
          </aside>

          <section ref={scrollContainerRef} className="min-h-0 overflow-y-auto overscroll-contain rounded-2xl border border-ufo-divider bg-ufo-surface px-4 py-5 md:px-6" aria-label={`${metadata.chatName} 전체 채팅 내역`}>
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
                  const isLastReadMessage = metadata.lastMessageId === message.id;

                  return (
                    <li key={message.id}>
                      {showDate ? <div className="my-5 flex items-center gap-3"><span className="h-px flex-1 bg-ufo-divider" /><time className="text-[11px] text-ufo-text-dim">{date}</time><span className="h-px flex-1 bg-ufo-divider" /></div> : null}
                      <article className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ufo-brand-pale text-xs font-bold text-ufo-brand" aria-hidden="true">{message.senderName.slice(0, 1)}</div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex min-w-0 items-baseline gap-2"><p className="truncate text-sm font-semibold text-ufo-text-secondary">{message.senderName}</p><time dateTime={message.createdAt} className="shrink-0 text-[11px] text-ufo-text-dim">{formatTime(message.createdAt)}</time></div>
                            <button type="button" onClick={() => { deleteMutation.reset(); setDeletingMessageId(message.id); }} className="min-h-8 shrink-0 rounded-lg px-2 text-xs font-semibold text-ufo-error" aria-label={`${message.senderName}님의 ${formatTime(message.createdAt)} 메시지 삭제`}>삭제</button>
                          </div>
                          <div className="mt-1 rounded-xl rounded-tl-sm bg-ufo-bg px-3 py-2.5">
                            {message.replyMessageId !== null ? (
                              <p className="mb-2 border-l-2 border-ufo-brand pl-2 text-[11px] leading-4 text-ufo-text-subtle">{message.replySenderName ?? "사용자"}님의 메시지에 답장 · 메시지 {message.replyMessageId}</p>
                            ) : null}
                            <p className="whitespace-pre-wrap break-words text-sm leading-6 text-ufo-text">{message.text}</p>
                          </div>
                        </div>
                      </article>
                      {isLastReadMessage ? <div className="my-4 flex items-center gap-3" aria-label="마지막으로 읽은 메시지"><span className="h-px flex-1 bg-ufo-border" /><span className="text-[10px] font-semibold text-ufo-brand">여기까지 읽음</span><span className="h-px flex-1 bg-ufo-border" /></div> : null}
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
