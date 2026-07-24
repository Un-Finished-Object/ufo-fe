"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import Pagination from "@/components/common/Pagination";
import SearchBar from "@/components/common/SearchBar";
import YesOrNo from "@/components/dialogs/YesOrNo";
import AdminRefreshButton from "@/features/admin/components/AdminRefreshButton";
import { mockAdminAlternativeComments } from "@/features/admin/data/mockAdminAlternativeComments";

const COMMENTS_PER_PAGE = 4;
const commentDateFormatter = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

function cloneMockComments() {
  return mockAdminAlternativeComments.map((comment) => ({ ...comment }));
}

export default function AdminAlternativeCommentScreen() {
  const [comments, setComments] = useState(cloneMockComments);
  const [query, setQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState<number | null>(null);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const filteredComments = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return comments;

    return comments.filter((comment) =>
      [
        comment.patternTitle,
        String(comment.patternId),
        String(comment.altSetId),
        String(comment.commentId),
        comment.username,
        comment.content,
      ].some((value) => value.toLowerCase().includes(normalizedQuery)),
    );
  }, [comments, query]);
  const totalPages = Math.max(1, Math.ceil(filteredComments.length / COMMENTS_PER_PAGE));
  const resolvedCurrentPage = Math.min(currentPage, totalPages);
  const visibleComments = filteredComments.slice(
    (resolvedCurrentPage - 1) * COMMENTS_PER_PAGE,
    resolvedCurrentPage * COMMENTS_PER_PAGE,
  );
  const patternCount = new Set(comments.map((comment) => comment.patternId)).size;
  const authorCount = new Set(comments.map((comment) => comment.username)).size;

  useEffect(() => () => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
  }, []);

  const handleRefresh = () => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    setIsRefreshing(true);
    refreshTimerRef.current = setTimeout(() => {
      setComments(cloneMockComments());
      setCurrentPage(1);
      setIsRefreshing(false);
    }, 400);
  };

  const handleDelete = () => {
    if (deletingCommentId === null) return;
    setComments((previous) =>
      previous.filter((comment) => comment.commentId !== deletingCommentId),
    );
    setDeletingCommentId(null);
  };

  return (
    <div className="px-4 py-5 md:px-8 md:py-8">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-ufo-brand">콘텐츠 운영</p>
          <h2 className="mt-1 text-xl font-bold tracking-tight text-ufo-text">대체실 댓글 관리</h2>
          <p className="mt-2 text-sm text-ufo-text-subtle">도안 대체실에 등록된 댓글을 확인하고 관리합니다.</p>
        </div>
        <AdminRefreshButton onRefresh={handleRefresh} isRefreshing={isRefreshing} />
      </div>

      <section aria-label="대체실 댓글 현황" className="grid grid-cols-3 gap-2 md:gap-4">
        <div className="rounded-xl border border-ufo-divider bg-ufo-surface px-3 py-3 md:px-5 md:py-4">
          <p className="text-xs text-ufo-text-subtle">전체 댓글</p>
          <p className="mt-1 text-xl font-bold text-ufo-text">{comments.length}</p>
        </div>
        <div className="rounded-xl border border-ufo-divider bg-ufo-surface px-3 py-3 md:px-5 md:py-4">
          <p className="text-xs text-ufo-text-subtle">관련 도안</p>
          <p className="mt-1 text-xl font-bold text-ufo-text">{patternCount}</p>
        </div>
        <div className="rounded-xl border border-ufo-divider bg-ufo-surface px-3 py-3 md:px-5 md:py-4">
          <p className="text-xs text-ufo-text-subtle">작성자</p>
          <p className="mt-1 text-xl font-bold text-ufo-text">{authorCount}</p>
        </div>
      </section>

      <section className="mt-6 overflow-hidden rounded-2xl border border-ufo-divider bg-ufo-surface" aria-labelledby="admin-comment-list-title">
        <div className="border-b border-ufo-divider px-1 py-1 md:flex md:items-center md:justify-between md:px-5 md:py-3">
          <div className="flex items-center justify-between px-3 pt-3 md:px-0 md:pt-0">
            <h3 id="admin-comment-list-title" className="text-sm font-bold text-ufo-text">댓글 목록</h3>
            <span className="ml-2 text-xs text-ufo-text-dim">{filteredComments.length}개</span>
          </div>
          <div className="md:w-[360px]">
            <SearchBar
              value={query}
              onChange={(value) => {
                setQuery(value);
                setCurrentPage(1);
              }}
              placeholder="도안, 작성자 또는 댓글 검색"
            />
          </div>
        </div>

        {visibleComments.length > 0 ? (
          <ul className="divide-y divide-ufo-divider">
            {visibleComments.map((comment) => (
              <li key={comment.commentId} className="px-4 py-4 md:px-5">
                <article className="grid gap-3 md:grid-cols-[minmax(180px,260px)_minmax(0,1fr)_auto] md:items-center md:gap-5">
                  <div className="min-w-0">
                    <Link href={`/patterns/${comment.patternId}`} className="block truncate text-sm font-semibold text-ufo-text underline-offset-2 hover:underline">
                      {comment.patternTitle}
                    </Link>
                    <p className="mt-1 text-xs text-ufo-text-subtle">
                      도안 {comment.patternId} · 대체실 {comment.altSetId}
                    </p>
                  </div>

                  <div className="rounded-lg bg-ufo-brand-pale px-3 py-2">
                    <p className="whitespace-pre-wrap break-words text-xs leading-5 text-ufo-text">{comment.content}</p>
                    <div className="mt-1 flex flex-wrap items-center justify-end gap-x-2 gap-y-1">
                      <span className="text-[10px] font-semibold text-ufo-text-secondary">{comment.username}</span>
                      <time dateTime={comment.createdAt} className="text-[10px] text-ufo-text-muted">
                        {commentDateFormatter.format(new Date(comment.createdAt))}
                      </time>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setDeletingCommentId(comment.commentId)}
                    className="min-h-9 justify-self-end rounded-lg border border-ufo-error px-3 text-xs font-semibold text-ufo-error"
                    aria-label={`${comment.username}님의 댓글 삭제`}
                  >
                    삭제
                  </button>
                </article>
              </li>
            ))}
          </ul>
        ) : (
          <div className="px-4 py-12 text-center">
            <p className="text-sm font-semibold text-ufo-text-secondary">조건에 맞는 댓글이 없습니다.</p>
            <button
              type="button"
              onClick={() => setQuery("")}
              className="mt-3 min-h-9 rounded-lg border border-ufo-divider px-3 text-xs font-semibold text-ufo-text-secondary"
            >
              검색 초기화
            </button>
          </div>
        )}

        <Pagination
          currentPage={resolvedCurrentPage}
          nextPage={Math.max(totalPages - resolvedCurrentPage, 0)}
          onPageChange={setCurrentPage}
        />
      </section>

      {deletingCommentId !== null ? (
        <YesOrNo
          mainText="댓글을 삭제할까요?"
          subText="삭제한 댓글은 복구할 수 없어요."
          yesLabel="삭제"
          noLabel="취소"
          onYes={handleDelete}
          onNo={() => setDeletingCommentId(null)}
        />
      ) : null}
    </div>
  );
}
