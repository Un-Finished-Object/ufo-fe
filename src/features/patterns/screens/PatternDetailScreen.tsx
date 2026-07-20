"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { type FormEvent, type ReactNode, useEffect, useRef, useState } from "react";
import StateBlock from "@/components/common/StateBlock";
import Pagination from "@/components/common/Pagination";
import ToastMessage from "@/components/common/ToastMessage";
import CreditBadge from "@/components/credits/CreditBadge";
import YesOrNo from "@/components/dialogs/YesOrNo";
import HeartIcon from "@/components/icons/HeartIcon";
import MobileShell from "@/components/layout/MobileShell";
import TopBar from "@/components/navigation/TopBar";
import { userQueryKeys } from "@/features/auth/queries/userQueries";
import { useAuthState } from "@/features/auth/hooks/useAuthState";
import { useWalletQuery } from "@/features/auth/hooks/useWalletQuery";
import { myChatRoomsQueryKey } from "@/features/chat/queries/chatQueries";
import { myActivityQueryKeys } from "@/features/my/queries/myActivityQueries";
import {
  patternAlternativesQueryRoot,
  patternAlternativesQueryOptions,
  type PatternAlternativeItem,
  type PatternAlternativeSet,
} from "@/features/patterns/queries/patternAlternativeQueries";
import {
  alternativeReactionQueryKey,
  alternativeReactionQueryOptions,
  updateAlternativeReaction,
  type AlternativeReaction,
} from "@/features/patterns/queries/patternAlternativeReactionQueries";
import {
  alternativeCommentsQueryOptions,
  alternativeCommentsQueryRoot,
  createAlternativeComment,
  deleteAlternativeComment,
  updateAlternativeComment,
} from "@/features/patterns/queries/patternAlternativeCommentQueries";
import type {
  OriginalYarn,
  OriginalYarnSet,
} from "@/features/patterns/queries/patternDetailQueries";
import {
  patternPurchaseQueryKey,
  patternPurchaseStatusQueryOptions,
  purchasePatternAccess,
  type PatternPurchaseType,
  type PatternPurchaseStatus,
} from "@/features/patterns/queries/patternPurchaseQueries";
import { patternDetailQueryOptions } from "@/features/patterns/queries/patternDetailQueries";
import { syncPatternScrapCaches } from "@/features/patterns/lib/syncPatternScrapCaches";
import { updatePatternScrap } from "@/features/patterns/services/updatePatternScrap";
import { useAuthRequiredToast } from "@/hooks/useAuthRequiredToast";
import { isApiError } from "@/lib/api/ApiError";

type PatternDetailScreenProps = {
  patternId: number;
};

type OriginalYarnSelectionState = {
  patternId: number | null;
  index: number;
};

const detailRows = [
  { label: "카테고리", key: "category" },
  { label: "사이즈", key: "size" },
  { label: "실측", key: "measurement" },
  { label: "사용바늘", key: "needle" },
  { label: "원작실", key: "yarn" },
  { label: "소요량", key: "amount" },
  { label: "게이지", key: "gauge" },
] as const;

type DetailTabValue = "description" | "alternative";
type PurchaseDialogType = "chat" | "alternative";

const detailTabOptions = [
  { label: "대체실정보", value: "alternative" },
  { label: "상세정보", value: "description" },
] as const;

const alternativePreviewCards = [0, 1, 2] as const;

const currencyFormatter = new Intl.NumberFormat("ko-KR");
const commentDateFormatter = new Intl.DateTimeFormat("ko-KR", {
  dateStyle: "short",
  timeStyle: "short",
});
const patternAccessCredits = 10;
const alternativesPerPage = 5;

type DetailTabSwitchProps = {
  value: DetailTabValue;
  onChange: (value: DetailTabValue) => void;
};

function DetailTabSwitch({ value, onChange }: DetailTabSwitchProps) {
  return (
    <div className="border-b border-ufo-border-light">
      <div className="grid grid-cols-2">
        {detailTabOptions.map((option) => {
          const isActive = option.value === value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={`-mb-px flex h-11 items-center justify-center gap-1 border-b-2 text-sm font-semibold transition-colors ${
                isActive
                  ? "border-ufo-brand text-ufo-border"
                  : "border-transparent text-ufo-text-muted"
              }`}
              aria-pressed={isActive}
            >
              <span>{option.label}</span>
              {isActive ? (
                <svg
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  className="h-3 w-3"
                >
                  <path d="M4.47 6.22a.75.75 0 0 1 1.06 0L8 8.69l2.47-2.47a.75.75 0 1 1 1.06 1.06l-3 3a.75.75 0 0 1-1.06 0l-3-3a.75.75 0 0 1 0-1.06Z" />
                </svg>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

type AlternativePurchaseGateProps = {
  credits: number;
  disabled: boolean;
  onPurchaseClick: () => void;
};

function AlternativePurchaseGate({
  credits,
  disabled,
  onPurchaseClick,
}: AlternativePurchaseGateProps) {
  const [isFooterVisible, setIsFooterVisible] = useState(false);
  const bottomSentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      const sentinel = bottomSentinelRef.current;

      if (!sentinel) {
        return;
      }

      const sentinelTop = sentinel.getBoundingClientRect().top;
      const viewportHeight = window.innerHeight;
      const hasUserScrolled = window.scrollY > 24;

      setIsFooterVisible(hasUserScrolled && sentinelTop <= viewportHeight - 24);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  return (
    <div className="pb-44">
      <div aria-hidden="true" className="space-y-4 px-5 pb-4 pt-2">
        {alternativePreviewCards.map((cardIndex) => (
          <article
            key={cardIndex}
            className={`rounded-[18px] border border-ufo-text-muted/35 bg-ufo-brand-pale px-4 py-4 ${
              cardIndex === 0 ? "" : "opacity-60 blur-[1.5px]"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <span className="block h-4 w-24 rounded-full bg-ufo-surface/90" />
                <div className="mt-3 space-y-2">
                  <span className="block h-2.5 w-full max-w-[168px] rounded-full bg-white/95" />
                  <span className="block h-2.5 w-full max-w-[132px] rounded-full bg-white/75" />
                </div>
              </div>
              <span className="mt-1 block h-10 w-10 rounded-full bg-white/85" />
            </div>

            <div className="mt-4 flex items-end justify-between">
              <span className="block h-3 w-20 rounded-full bg-white/70" />
              <span className="block h-4 w-16 rounded-full bg-ufo-border/60" />
            </div>
          </article>
        ))}
      </div>

      <div ref={bottomSentinelRef} aria-hidden="true" className="h-px w-full" />

      <div
        className={`pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center transition-all duration-500 ease-out ${
          isFooterVisible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
        }`}
      >
        <div className="pointer-events-auto w-full max-w-[430px] bg-ufo-border px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-8">
          <p className="text-lg leading-[1.25] tracking-[-0.02em] text-ufo-text">
            더 많은 대체실 정보를 확인해보세요.
          </p>
          <p className="mt-3 text-[14px] leading-6 text-ufo-text-secondary">
            아래 버튼을 클릭하시면, 해당 도안의 유용한 대체실 정보를 구매하실 수 있습니다.
          </p>

          <button
            type="button"
            onClick={onPurchaseClick}
            disabled={disabled}
            className="mt-5 flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-ufo-surface px-3 text-sm font-bold text-ufo-text-secondary disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span>대체실 정보 평생소장하기</span>
            <CreditBadge
              credits={credits}
              className="bg-transparent text-ufo-credit"
              circleClassName="text-ufo-credit"
              starClassName="text-ufo-surface"
            />
          </button>
        </div>
      </div>
    </div>
  );
}

function formatAlternativeNumber(value: number | null, unit: string) {
  if (value === null || value <= 0) {
    return null;
  }

  return `${currencyFormatter.format(value)}${unit}`;
}

function getAlternativeText(value: string) {
  const trimmedValue = value.trim();

  return trimmedValue ? trimmedValue : null;
}

type YarnInfoDetailItem = {
  label: string;
  value: string;
};

type YarnInfoScoreItem = {
  label: string;
  value: number | null;
};

type YarnInfoCardData = {
  yarnName: string;
  ranking?: number | null;
  altId?: number | null;
  subComponent?: string;
  cost?: number | null;
  detailItems?: YarnInfoDetailItem[];
  scoreItems?: YarnInfoScoreItem[];
};

function getAlternativeDetailItems(item: PatternAlternativeItem): YarnInfoDetailItem[] {
  return [
    { label: "실 합수", value: formatAlternativeNumber(item.ply, "합") },
    { label: "무게", value: formatAlternativeNumber(item.weight, "g") },
    { label: "길이", value: formatAlternativeNumber(item.length, "m") },
    { label: "구매처", value: getAlternativeText(item.store) },
  ].filter((detail): detail is { label: string; value: string } => detail.value !== null);
}

function getAlternativeScoreItems(item: PatternAlternativeItem): YarnInfoScoreItem[] {
  return [
    { label: "성분", value: item.componentScore },
    { label: "길이", value: item.lengthScore },
    { label: "게이지", value: item.gaugeScore },
    { label: "바늘", value: item.needleScore },
  ];
}

function hasVisibleAlternativeInfo(item: PatternAlternativeItem) {
  return (
    getAlternativeText(item.yarnName) !== null ||
    getAlternativeText(item.component) !== null ||
    formatAlternativeNumber(item.cost, "원") !== null ||
    getAlternativeDetailItems(item).length > 0 ||
    getAlternativeScoreItems(item).some((score) => score.value !== null)
  );
}

function getAlternativeCardData(item: PatternAlternativeItem): YarnInfoCardData {
  return {
    yarnName: item.yarnName,
    ranking: item.ranking,
    altId: item.altId,
    subComponent: item.component,
    cost: item.cost,
    detailItems: getAlternativeDetailItems(item),
    scoreItems: getAlternativeScoreItems(item),
  };
}

function hasVisibleAlternativeSetInfo(yarnSet: PatternAlternativeSet) {
  return [...yarnSet.firstYarn, ...yarnSet.secondYarn, ...yarnSet.subYarn].some(
    hasVisibleAlternativeInfo,
  );
}

function AlternativeReactionButton({ altId }: { altId: number }) {
  const queryClient = useQueryClient();
  const reactionQuery = useQuery(alternativeReactionQueryOptions(altId));
  const reactionMutation = useMutation({
    mutationFn: (type: 1 | 2) => updateAlternativeReaction({ altId, type }),
    onSuccess: (reaction) => {
      queryClient.setQueryData<AlternativeReaction>(
        alternativeReactionQueryKey(altId),
        reaction,
      );
    },
  });
  const isLiked = reactionQuery.data?.type === 1;
  const likesCount = reactionQuery.data?.likesCount ?? 0;

  return (
    <button
      type="button"
      onClick={() => reactionMutation.mutate(isLiked ? 2 : 1)}
      disabled={reactionQuery.isPending || reactionMutation.isPending}
      className="flex min-h-8 items-center gap-1 rounded-full px-2 text-xs font-semibold text-ufo-text-secondary disabled:cursor-not-allowed disabled:opacity-60"
      aria-label={isLiked ? `좋아요 취소, 현재 ${likesCount}개` : `좋아요, 현재 ${likesCount}개`}
      aria-pressed={isLiked}
    >
      <HeartIcon
        variant={isLiked ? "filled" : "outline"}
        className={isLiked ? "h-4 w-4 fill-ufo-brand stroke-ufo-brand" : "h-4 w-4 stroke-ufo-brand"}
      />
      <span>{likesCount}</span>
    </button>
  );
}

function AlternativeComments({
  altSetId,
  reactionAction,
}: {
  altSetId: number;
  reactionAction: ReactNode;
}) {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [content, setContent] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [deletingCommentId, setDeletingCommentId] = useState<number | null>(null);
  const commentsQuery = useQuery({
    ...alternativeCommentsQueryOptions(altSetId, currentPage),
    enabled: isOpen,
  });
  const createCommentMutation = useMutation({
    mutationFn: (nextContent: string) =>
      createAlternativeComment({ altSetId, content: nextContent }),
    onSuccess: async () => {
      setContent("");
      setCurrentPage(1);
      await queryClient.invalidateQueries({
        queryKey: [...alternativeCommentsQueryRoot, altSetId],
      });
    },
  });
  const updateCommentMutation = useMutation({
    mutationFn: ({ commentId, nextContent }: { commentId: number; nextContent: string }) =>
      updateAlternativeComment({ altSetId, commentId, content: nextContent }),
    onSuccess: async () => {
      setEditingCommentId(null);
      setEditingContent("");
      await queryClient.invalidateQueries({
        queryKey: [...alternativeCommentsQueryRoot, altSetId],
      });
    },
  });
  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: number) => deleteAlternativeComment({ altSetId, commentId }),
    onSuccess: async () => {
      setDeletingCommentId(null);
      await queryClient.invalidateQueries({
        queryKey: [...alternativeCommentsQueryRoot, altSetId],
      });
    },
  });
  const comments = commentsQuery.data?.comments ?? [];
  const responsePage = commentsQuery.data?.page ?? currentPage;
  const nextPage = commentsQuery.data?.nextPage ?? 0;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedContent = content.trim();

    if (!trimmedContent || createCommentMutation.isPending) {
      return;
    }

    createCommentMutation.mutate(trimmedContent);
  };

  const handleEditSubmit = (event: FormEvent<HTMLFormElement>, commentId: number) => {
    event.preventDefault();
    const trimmedContent = editingContent.trim();

    if (!trimmedContent || updateCommentMutation.isPending) {
      return;
    }

    updateCommentMutation.mutate({ commentId, nextContent: trimmedContent });
  };

  return (
    <div className="border-t border-ufo-border-light">
      <div className="flex items-center justify-between pt-1.5">
        <button
          type="button"
          onClick={() => setIsOpen((previous) => !previous)}
          className="min-h-8 rounded-full px-2 text-xs font-semibold text-ufo-text-secondary"
          aria-expanded={isOpen}
        >
          댓글 {isOpen ? "접기" : "보기"}
        </button>
        {reactionAction}
      </div>

      {isOpen ? (
        <div className="space-y-3 pb-1 pt-2">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <label htmlFor={`alternative-comment-${altSetId}`} className="sr-only">
              대체실 댓글
            </label>
            <input
              id={`alternative-comment-${altSetId}`}
              value={content}
              onChange={(event) => setContent(event.target.value)}
              maxLength={500}
              placeholder="댓글을 입력해주세요."
              className="min-w-0 flex-1 rounded-lg border border-ufo-border-light bg-white px-3 py-2 text-xs text-ufo-text outline-none focus:border-ufo-brand"
            />
            <button
              type="submit"
              disabled={!content.trim() || createCommentMutation.isPending}
              className="shrink-0 rounded-lg bg-ufo-brand px-3 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {createCommentMutation.isPending ? "등록 중" : "등록"}
            </button>
          </form>

          {createCommentMutation.isError ? (
            <p className="text-xs text-ufo-error">댓글을 등록하지 못했어요.</p>
          ) : null}
          {commentsQuery.isPending ? (
            <p className="text-xs text-ufo-text-muted">댓글을 불러오고 있어요.</p>
          ) : commentsQuery.isError ? (
            <p className="text-xs text-ufo-error">댓글을 불러오지 못했어요.</p>
          ) : comments.length > 0 ? (
            <div className="space-y-2">
              {comments.map((comment) => (
                <div
                  key={comment.commentId}
                  className="rounded-lg bg-ufo-brand-pale px-3 py-2"
                >
                  {editingCommentId === comment.commentId ? (
                    <form
                      onSubmit={(event) => handleEditSubmit(event, comment.commentId)}
                      className="space-y-2"
                    >
                      <label htmlFor={`alternative-comment-edit-${comment.commentId}`} className="sr-only">
                        댓글 수정
                      </label>
                      <input
                        id={`alternative-comment-edit-${comment.commentId}`}
                        value={editingContent}
                        onChange={(event) => setEditingContent(event.target.value)}
                        maxLength={500}
                        className="w-full rounded-lg border border-ufo-border-light bg-white px-3 py-2 text-xs text-ufo-text outline-none focus:border-ufo-brand"
                        autoFocus
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCommentId(null);
                            setEditingContent("");
                          }}
                          disabled={updateCommentMutation.isPending}
                          className="min-h-7 px-2 text-xs font-semibold text-ufo-text-secondary disabled:opacity-50"
                        >
                          취소
                        </button>
                        <button
                          type="submit"
                          disabled={!editingContent.trim() || updateCommentMutation.isPending}
                          className="min-h-7 rounded-md bg-ufo-brand px-3 text-xs font-bold text-white disabled:opacity-50"
                        >
                          {updateCommentMutation.isPending ? "수정 중" : "완료"}
                        </button>
                      </div>
                      {updateCommentMutation.isError ? (
                        <p className="text-xs text-ufo-error">댓글을 수정하지 못했어요.</p>
                      ) : null}
                    </form>
                  ) : (
                    <>
                      <p className="whitespace-pre-wrap break-words text-xs leading-5 text-ufo-text">
                        {comment.content}
                      </p>
                      <div className="mt-1 flex items-center justify-end gap-2">
                        <time
                          dateTime={comment.createdAt}
                          className="text-[10px] text-ufo-text-muted"
                        >
                          {commentDateFormatter.format(new Date(comment.createdAt))}
                        </time>
                        {comment.isMine ? (
                          <div className="flex items-center text-[10px] text-ufo-text-secondary">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingCommentId(comment.commentId);
                                setEditingContent(comment.content);
                              }}
                              className="min-h-7 px-1.5"
                            >
                              수정
                            </button>
                            <span aria-hidden="true">|</span>
                            <button
                              type="button"
                              onClick={() => setDeletingCommentId(comment.commentId)}
                              className="min-h-7 px-1.5"
                            >
                              삭제
                            </button>
                          </div>
                        ) : null}
                      </div>
                    </>
                  )}
                </div>
              ))}
              <Pagination
                currentPage={responsePage}
                nextPage={nextPage}
                onPageChange={setCurrentPage}
                className="py-2"
              />
            </div>
          ) : (
            <p className="text-xs text-ufo-text-muted">첫 댓글을 남겨보세요.</p>
          )}
        </div>
      ) : null}
      {deletingCommentId !== null ? (
        <YesOrNo
          mainText="댓글을 삭제할까요?"
          subText="삭제한 댓글은 복구할 수 없어요."
          yesLabel={deleteCommentMutation.isPending ? "삭제 중" : "삭제"}
          noLabel="취소"
          yesDisabled={deleteCommentMutation.isPending}
          noDisabled={deleteCommentMutation.isPending}
          onYes={() => deleteCommentMutation.mutate(deletingCommentId)}
          onNo={() => setDeletingCommentId(null)}
        />
      ) : null}
    </div>
  );
}

function YarnInfoCard({ card }: { card: YarnInfoCardData }) {
  const yarnName = getAlternativeText(card.yarnName);
  const subComponent = card.subComponent ? getAlternativeText(card.subComponent) : null;
  const cost = formatAlternativeNumber(card.cost ?? null, "원");
  const detailItems = card.detailItems ?? [];
  const scoreItems = card.scoreItems ?? [];
  const visibleScoreItems = scoreItems.filter((score) => score.value !== null);
  const hasHeaderContent = yarnName !== null || subComponent !== null || cost !== null;

  return (
    <article className="rounded-xl border border-ufo-border bg-white px-3 py-2.5">
      {hasHeaderContent ? (
        <div className="flex items-start justify-between gap-2.5">
          {yarnName || subComponent ? (
            <div className="min-w-0 flex-1">
              {yarnName ? (
                <p className="flex items-start gap-1.5 break-words text-sm font-bold leading-5 text-ufo-text">
                  {card.ranking !== null && card.ranking !== undefined ? (
                    <span className="shrink-0 text-ufo-brand">{card.ranking}위</span>
                  ) : null}
                  <span>{yarnName}</span>
                </p>
              ) : null}
              {subComponent ? (
                <p className="mt-0.5 break-words text-[11px] font-medium leading-4 text-ufo-text-secondary">
                  {subComponent}
                </p>
              ) : null}
            </div>
          ) : null}
          {cost ? (
            <div className="shrink-0 rounded-full bg-ufo-brand-pale px-2 py-0.5 text-[10px] font-bold leading-4 text-ufo-text-secondary">
              {cost}
            </div>
          ) : null}
        </div>
      ) : null}

      {detailItems.length > 0 ? (
        <dl
          className={`flex flex-wrap gap-x-2 gap-y-1 text-[11px] leading-4 ${
            hasHeaderContent ? "mt-1.5" : ""
          }`}
        >
          {detailItems.map((detail) => (
            <div key={detail.label} className="flex min-w-0 items-center gap-1">
              <dt className="shrink-0 font-semibold text-ufo-text-muted">{detail.label}</dt>
              <dd className="break-words font-bold text-ufo-text-secondary">{detail.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      {visibleScoreItems.length > 0 ? (
        <div
          className={`grid grid-cols-4 gap-1.5 ${
            hasHeaderContent || detailItems.length > 0 ? "mt-3" : ""
          }`}
        >
          {scoreItems.map((score) => {
            const scoreValue = score.value ?? 0;
            const percent = Math.max(0, Math.min(100, scoreValue));
            const scoreText = score.value === null ? "-" : `${Math.round(scoreValue)}점`;

            return (
              <div key={score.label} className="min-w-0" aria-label={`${score.label} 점수 ${scoreText}`}>
                <span className="block truncate text-[10px] font-bold text-ufo-text-subtle">
                  {score.label} {scoreText}
                </span>
                <span
                  className="relative mt-1 block h-1.5 overflow-hidden rounded-full bg-ufo-border-light"
                  aria-hidden="true"
                >
                  <span
                    className="absolute inset-y-0 left-0 rounded-full bg-ufo-brand"
                    style={{ width: `${percent}%` }}
                  />
                </span>
              </div>
            );
          })}
        </div>
      ) : null}
      {typeof card.altId === "number" ? (
        <div className="mt-2">
          <AlternativeComments
            altSetId={card.altId}
            reactionAction={<AlternativeReactionButton altId={card.altId} />}
          />
        </div>
      ) : null}
    </article>
  );
}

type OriginalYarnRole = "first" | "second" | "sub";

type OriginalYarnSelectOption = {
  value: number | null;
  title: string;
  subtitle: string | null;
  selected: boolean;
};

function getOriginalYarnRoleLabel(role: OriginalYarnRole) {
  if (role === "first") {
    return "메인실";
  }

  if (role === "second") {
    return "배색실";
  }

  return "합사실";
}

function getYarnName(yarn: OriginalYarn) {
  return getAlternativeText(yarn.yarnName) ?? "실 이름 없음";
}

function getYarnSelectSubtitle(yarn: OriginalYarn) {
  const detailTexts = [getAlternativeText(yarn.component), getAlternativeText(yarn.store)]
    .filter((text): text is string => text !== null);

  return detailTexts.length > 0 ? detailTexts.join(" · ") : null;
}

function getOriginalYarnDetailItems(yarn: OriginalYarn): YarnInfoDetailItem[] {
  return [
    { label: "실 합수", value: formatAlternativeNumber(yarn.ply, "합") },
    { label: "무게", value: formatAlternativeNumber(yarn.weight, "g") },
    { label: "길이", value: formatAlternativeNumber(yarn.length, "m") },
    { label: "구매처", value: getAlternativeText(yarn.store) },
  ].filter((detail): detail is YarnInfoDetailItem => detail.value !== null);
}

function getOriginalYarnCardData(yarn: OriginalYarn): YarnInfoCardData {
  return {
    yarnName: getYarnName(yarn),
    subComponent: yarn.component,
    cost: yarn.cost,
    detailItems: getOriginalYarnDetailItems(yarn),
  };
}

function getOriginalYarnEntries(yarnSet: OriginalYarnSet) {
  return [
    { label: "메인실", yarn: yarnSet.firstYarn },
    yarnSet.secondYarn ? { label: "배색실", yarn: yarnSet.secondYarn } : null,
    yarnSet.subYarn ? { label: "합사실", yarn: yarnSet.subYarn } : null,
  ].filter(
    (entry): entry is { label: string; yarn: OriginalYarn } => entry !== null,
  );
}

function getUniqueYarns(yarns: OriginalYarn[]) {
  const yarnMap = new Map<number, OriginalYarn>();

  yarns.forEach((yarn) => {
    if (!yarnMap.has(yarn.yarnId)) {
      yarnMap.set(yarn.yarnId, yarn);
    }
  });

  return Array.from(yarnMap.values());
}

function getYarnForRole(yarnSet: OriginalYarnSet, role: OriginalYarnRole) {
  if (role === "first") {
    return yarnSet.firstYarn;
  }

  return role === "second" ? yarnSet.secondYarn : yarnSet.subYarn;
}

function getYarnIdForRole(yarnSet: OriginalYarnSet, role: OriginalYarnRole) {
  return getYarnForRole(yarnSet, role)?.yarnId ?? null;
}

function getOriginalYarnRoleOptions(
  originalYarnSets: OriginalYarnSet[],
  activeYarnSet: OriginalYarnSet,
  role: OriginalYarnRole,
): OriginalYarnSelectOption[] {
  if (role === "first") {
    return getUniqueYarns(originalYarnSets.map((yarnSet) => yarnSet.firstYarn)).map(
      (yarn) => ({
        value: yarn.yarnId,
        title: getYarnName(yarn),
        subtitle: getYarnSelectSubtitle(yarn),
        selected: yarn.yarnId === activeYarnSet.firstYarn.yarnId,
      }),
    );
  }

  const roleLabel = getOriginalYarnRoleLabel(role);
  const setsWithSameMainYarn = originalYarnSets.filter(
    (yarnSet) => yarnSet.firstYarn.yarnId === activeYarnSet.firstYarn.yarnId,
  );
  const yarns = setsWithSameMainYarn
    .map((yarnSet) => getYarnForRole(yarnSet, role))
    .filter((yarn): yarn is OriginalYarn => yarn !== null);
  const uniqueYarns = getUniqueYarns(yarns);
  const hasEmptyCombination = setsWithSameMainYarn.some(
    (yarnSet) => getYarnForRole(yarnSet, role) === null,
  );

  if (uniqueYarns.length === 0) {
    return [];
  }

  const options: OriginalYarnSelectOption[] = uniqueYarns.map((yarn) => ({
    value: yarn.yarnId,
    title: getYarnName(yarn),
    subtitle: getYarnSelectSubtitle(yarn),
    selected: yarn.yarnId === getYarnIdForRole(activeYarnSet, role),
  }));

  if (hasEmptyCombination) {
    options.push({
      value: null,
      title: `${roleLabel} 없음`,
      subtitle: "선택한 메인실에서 해당 실을 사용하지 않는 조합",
      selected: getYarnIdForRole(activeYarnSet, role) === null,
    });
  }

  return options;
}

function findOriginalYarnSetIndex(
  originalYarnSets: OriginalYarnSet[],
  activeYarnSet: OriginalYarnSet,
  role: OriginalYarnRole,
  selectedYarnId: number | null,
) {
  const nextIndex = originalYarnSets.findIndex((yarnSet) => {
    if (role === "first") {
      return yarnSet.firstYarn.yarnId === selectedYarnId;
    }

    return (
      yarnSet.firstYarn.yarnId === activeYarnSet.firstYarn.yarnId &&
      getYarnIdForRole(yarnSet, role) === selectedYarnId
    );
  });

  return nextIndex === -1 ? null : nextIndex;
}

function OriginalYarnSelectButton({
  label,
  value,
  onClick,
}: {
  label: string;
  value: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-12 items-center justify-between gap-3 rounded-xl border border-ufo-border-light bg-white px-3 py-2 text-left"
    >
      <span>
        <span className="block text-[11px] font-semibold text-ufo-text-muted">
          {label}
        </span>
        <span className="mt-0.5 block break-words text-sm font-bold text-ufo-text">
          {value}
        </span>
      </span>
      <span aria-hidden="true" className="shrink-0 text-sm font-bold text-ufo-brand">
        선택
      </span>
    </button>
  );
}

function OriginalYarnSelector({
  activeYarnSet,
  originalYarnSets,
  onOpen,
}: {
  activeYarnSet: OriginalYarnSet;
  originalYarnSets: OriginalYarnSet[];
  onOpen: (role: OriginalYarnRole) => void;
}) {
  const firstOptions = getOriginalYarnRoleOptions(
    originalYarnSets,
    activeYarnSet,
    "first",
  );
  const secondOptions = getOriginalYarnRoleOptions(
    originalYarnSets,
    activeYarnSet,
    "second",
  );
  const subOptions = getOriginalYarnRoleOptions(originalYarnSets, activeYarnSet, "sub");
  const selectButtons = [
    firstOptions.length > 0
      ? {
          role: "first" as const,
          label: "메인실",
          value: getYarnName(activeYarnSet.firstYarn),
        }
      : null,
    secondOptions.length > 0
      ? {
          role: "second" as const,
          label: "배색실",
          value: activeYarnSet.secondYarn
            ? getYarnName(activeYarnSet.secondYarn)
            : "배색실 없음",
        }
      : null,
    subOptions.length > 0
      ? {
          role: "sub" as const,
          label: "합사실",
          value: activeYarnSet.subYarn
            ? getYarnName(activeYarnSet.subYarn)
            : "합사실 없음",
        }
      : null,
  ].filter(
    (button): button is { role: OriginalYarnRole; label: string; value: string } =>
      button !== null,
  );

  if (selectButtons.length === 0) {
    return null;
  }

  return (
    <div className="mb-3 grid gap-2">
      {selectButtons.map((button) => (
        <OriginalYarnSelectButton
          key={button.role}
          label={button.label}
          value={button.value}
          onClick={() => onOpen(button.role)}
        />
      ))}
    </div>
  );
}

function OriginalYarnSelectSheet({
  role,
  options,
  onSelect,
  onClose,
}: {
  role: OriginalYarnRole;
  options: OriginalYarnSelectOption[];
  onSelect: (value: number | null) => void;
  onClose: () => void;
}) {
  const title = `${getOriginalYarnRoleLabel(role)} 선택`;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/20"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <button
        type="button"
        aria-label="선택 창 닫기"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />
      <div className="relative w-full max-w-[430px] rounded-t-2xl bg-ufo-surface px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 shadow-lg">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="text-base font-bold text-ufo-text">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-ufo-border-light px-3 py-1 text-xs font-semibold text-ufo-text-secondary"
          >
            닫기
          </button>
        </div>
        <div className="max-h-[60vh] space-y-2 overflow-y-auto pb-1">
          {options.map((option) => (
            <button
              key={`${role}-${option.value ?? "none"}`}
              type="button"
              onClick={() => onSelect(option.value)}
              className={`w-full rounded-xl border px-3 py-3 text-left ${
                option.selected
                  ? "border-ufo-brand bg-ufo-brand-pale"
                  : "border-ufo-border-light bg-white"
              }`}
              aria-pressed={option.selected}
            >
              <span className="block text-sm font-bold text-ufo-text">
                {option.title}
              </span>
              {option.subtitle ? (
                <span className="mt-1 block text-xs leading-4 text-ufo-text-secondary">
                  {option.subtitle}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function OriginalYarnSetCards({
  yarnSet,
}: {
  yarnSet: OriginalYarnSet;
}) {
  return (
    <div className="space-y-3">
      {getOriginalYarnEntries(yarnSet).map((entry) => (
        <div key={`${entry.label}-${entry.yarn.yarnId}`}>
          <p className="mb-1 px-1 text-sm font-bold text-ufo-text-secondary">
            {entry.label}
          </p>
          <YarnInfoCard card={getOriginalYarnCardData(entry.yarn)} />
        </div>
      ))}
    </div>
  );
}

function RankedAlternativeYarnList({
  label,
  items,
}: {
  label: string;
  items: PatternAlternativeItem[];
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const visibleItems = items.filter(hasVisibleAlternativeInfo);
  const totalPages = Math.ceil(visibleItems.length / alternativesPerPage);
  const safeCurrentPage = Math.min(currentPage, Math.max(totalPages, 1));
  const pageItems = visibleItems.slice(
    (safeCurrentPage - 1) * alternativesPerPage,
    safeCurrentPage * alternativesPerPage,
  );

  if (visibleItems.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <p className="px-1 text-sm font-bold text-ufo-text-secondary">{label}</p>
      {pageItems.map((item, itemIndex) => (
        <YarnInfoCard
          key={item.altId ?? `${item.yarnId ?? "unknown"}-${item.ranking ?? itemIndex}`}
          card={getAlternativeCardData(item)}
        />
      ))}
      <Pagination
        currentPage={safeCurrentPage}
        nextPage={Math.max(totalPages - safeCurrentPage, 0)}
        onPageChange={setCurrentPage}
        className="py-2"
      />
    </div>
  );
}

function RankedAlternativeYarnGroups({ sets }: { sets: PatternAlternativeSet[] }) {
  const firstYarns = sets.flatMap((set) => set.firstYarn);
  const secondYarns = sets.flatMap((set) => set.secondYarn);
  const subYarns = sets.flatMap((set) => set.subYarn);

  return (
    <div className="space-y-5">
      <RankedAlternativeYarnList label="메인실" items={firstYarns} />
      <RankedAlternativeYarnList label="배색실" items={secondYarns} />
      <RankedAlternativeYarnList label="합사실" items={subYarns} />
    </div>
  );
}

function AlternativeYarnSection({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="border-t border-ufo-border-light pt-4 first:border-t-0 first:pt-0">
      <div className="mb-2 flex items-center justify-between gap-3 px-1">
        <h3 className="text-base font-bold text-ufo-text">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

function AlternativeSectionMessage({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl bg-ufo-brand-pale p-4 text-sm text-ufo-text-secondary">
      {children}
    </div>
  );
}

export default function PatternDetailScreen({
  patternId,
}: PatternDetailScreenProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { authStatus, isAuthenticated, data: currentUser } = useAuthState();
  const authCacheKey = isAuthenticated
    ? currentUser?.userId ?? currentUser?.email ?? "member"
    : "guest";
  const patternDetailQuery = useQuery({
    ...patternDetailQueryOptions(patternId, authCacheKey),
    enabled: authStatus !== "loading",
  });
  const pattern = patternDetailQuery.data ?? null;
  const { showAuthRequiredToast, toastMessage } = useAuthRequiredToast();
  const walletQuery = useWalletQuery({ enabled: isAuthenticated && pattern !== null });
  const [activeTab, setActiveTab] = useState<DetailTabValue>("alternative");
  const [originalYarnSelectionState, setOriginalYarnSelectionState] =
    useState<OriginalYarnSelectionState>({
      patternId: null,
      index: 0,
    });
  const [selectedOriginalYarnRole, setSelectedOriginalYarnRole] =
    useState<OriginalYarnRole | null>(null);
  const [purchaseDialogType, setPurchaseDialogType] = useState<PurchaseDialogType | null>(null);
  const [purchaseErrorMessage, setPurchaseErrorMessage] = useState<string | null>(null);
  const profileHref = isAuthenticated ? "/my" : "/login";
  const isScrapped = pattern?.isScrapped ?? false;
  const scrapCount = pattern?.stats.scraps ?? 0;
  const originalYarnSets = pattern?.originalYarnSets ?? [];
  const originalYarnSelectionPatternId = pattern?.id ?? null;
  const requestedOriginalYarnSetIndex =
    originalYarnSelectionState.patternId === originalYarnSelectionPatternId
      ? originalYarnSelectionState.index
      : 0;
  const activeOriginalYarnSetIndex = Math.min(
    requestedOriginalYarnSetIndex,
    Math.max(originalYarnSets.length - 1, 0),
  );
  const activeOriginalYarnSet = originalYarnSets[activeOriginalYarnSetIndex] ?? null;
  const activeOriginalYarnSetId = activeOriginalYarnSet?.originalYarnSetId ?? null;
  const selectedOriginalYarnOptions =
    activeOriginalYarnSet && selectedOriginalYarnRole
      ? getOriginalYarnRoleOptions(
          originalYarnSets,
          activeOriginalYarnSet,
          selectedOriginalYarnRole,
        )
      : [];

  const purchaseStatusQuery = useQuery({
    ...patternPurchaseStatusQueryOptions(pattern?.id ?? 0),
    enabled: authStatus !== "loading" && isAuthenticated && pattern !== null,
  });
  const hasChatPurchase = purchaseStatusQuery.data?.chat === true;
  const purchasedChatroomId = purchaseStatusQuery.data?.chatroomId ?? null;
  const hasAlternativePurchase = purchaseStatusQuery.data?.alternative === true;
  const patternAlternativesQuery = useQuery({
    ...patternAlternativesQueryOptions(activeOriginalYarnSetId ?? 0),
    enabled:
      authStatus !== "loading" &&
      isAuthenticated &&
      pattern !== null &&
      hasAlternativePurchase &&
      activeOriginalYarnSetId !== null,
  });
  const isResolvingChatPurchase =
    pattern === null ||
    authStatus === "loading" ||
    (isAuthenticated &&
      (purchaseStatusQuery.isPending ||
        purchaseStatusQuery.isFetching ||
        (hasChatPurchase && purchasedChatroomId === null)));
  const isResolvingAlternativePurchase =
    pattern === null ||
    authStatus === "loading" ||
    (isAuthenticated && purchaseStatusQuery.isPending);
  const shouldShowChatCreditBadge =
    pattern !== null && authStatus !== "loading" && !hasChatPurchase;
  const currentCreditText = walletQuery.isPending
    ? "불러오는 중..."
    : `${walletQuery.data ?? 0} 크레딧`;
  const isPurchaseDialogOpen = purchaseDialogType !== null;
  const purchaseDialogTitle =
    purchaseDialogType === "alternative"
      ? "대체실 정보를 구매하시겠습니까?"
      : "채팅방에 입장하시겠습니까?";
  const purchaseDialogErrorText =
    purchaseDialogType === "alternative"
      ? "대체실 정보 구매에 실패했어요. 잠시 후 다시 시도해주세요."
      : "채팅방 구매에 실패했어요. 잠시 후 다시 시도해주세요.";
  const visibleAlternativeSets =
    patternAlternativesQuery.data?.filter(hasVisibleAlternativeSetInfo) ?? [];

  const toggleScrapMutation = useMutation<
    Awaited<ReturnType<typeof updatePatternScrap>>,
    Error,
    boolean
  >({
    mutationFn: (nextIsScrapped: boolean) =>
      updatePatternScrap({
        patternId: pattern?.id ?? 0,
        shouldScrap: nextIsScrapped,
      }),
    onSuccess: (result) => {
      syncPatternScrapCaches(queryClient, {
        patternId,
        scrapped: result.scrapped,
        scrapCount: result.scrapCount,
        viewerKey: authCacheKey,
      });
    },
    onError: (error) => {
      if (isApiError(error, 401)) {
        showAuthRequiredToast();
      }
    },
  });

  const purchaseAccessMutation = useMutation({
    mutationFn: ({ type }: { type: PatternPurchaseType }) =>
      purchasePatternAccess({ patternId: pattern?.id ?? 0, type }),
    onSuccess: async (data) => {
      if (!pattern) {
        return;
      }

      queryClient.setQueryData<PatternPurchaseStatus | null>(
        patternPurchaseQueryKey(pattern.id),
        (previous) => ({
          userId: data.userId ?? previous?.userId ?? null,
          chat: data.type === "chat" ? true : previous?.chat ?? false,
          chatroomId:
            data.type === "chat"
              ? data.chatroomId ?? previous?.chatroomId ?? null
              : previous?.chatroomId ?? null,
          alternative: data.type === "yarn" ? true : previous?.alternative ?? false,
        }),
      );
      const invalidations = [
        queryClient.invalidateQueries({ queryKey: userQueryKeys.wallet }),
        queryClient.invalidateQueries({
          queryKey: patternPurchaseQueryKey(pattern.id),
        }),
        queryClient.invalidateQueries({
          queryKey: myActivityQueryKeys.purchasedProjects,
        }),
      ];

      if (data.type === "chat") {
        invalidations.push(
          queryClient.invalidateQueries({ queryKey: myChatRoomsQueryKey }),
        );
      }
      if (data.type === "yarn") {
        invalidations.push(
          queryClient.invalidateQueries({
            queryKey: patternAlternativesQueryRoot,
          }),
        );
      }

      await Promise.all(invalidations);
      setPurchaseErrorMessage(null);
      setPurchaseDialogType(null);
    },
    onError: (error) => {
      if (isApiError(error, 401)) {
        setPurchaseDialogType(null);
        showAuthRequiredToast();
        return;
      }

      setPurchaseErrorMessage(purchaseDialogErrorText);
    },
  });

  const handleChatRoomClick = () => {
    if (!pattern) {
      return;
    }

    if (!isAuthenticated) {
      showAuthRequiredToast();
      return;
    }

    if (hasChatPurchase && purchasedChatroomId !== null) {
      router.push(`/chats/${purchasedChatroomId}`);
      return;
    }

    setPurchaseErrorMessage(null);
    setPurchaseDialogType("chat");
  };

  const handleAlternativePurchaseClick = () => {
    if (!pattern) {
      return;
    }

    if (!isAuthenticated) {
      showAuthRequiredToast();
      return;
    }

    if (hasAlternativePurchase) {
      return;
    }

    setPurchaseErrorMessage(null);
    setPurchaseDialogType("alternative");
  };

  const handleScrapClick = () => {
    if (!pattern || toggleScrapMutation.isPending) {
      return;
    }

    if (authStatus === "loading") {
      return;
    }

    if (!isAuthenticated) {
      showAuthRequiredToast();
      return;
    }

    toggleScrapMutation.mutate(!isScrapped);
  };

  const handleOriginalYarnSelect = (selectedYarnId: number | null) => {
    if (!pattern || !activeOriginalYarnSet || !selectedOriginalYarnRole) {
      return;
    }

    const nextOriginalYarnSetIndex = findOriginalYarnSetIndex(
      originalYarnSets,
      activeOriginalYarnSet,
      selectedOriginalYarnRole,
      selectedYarnId,
    );

    if (nextOriginalYarnSetIndex === null) {
      return;
    }

    setOriginalYarnSelectionState({
      patternId: pattern.id,
      index: nextOriginalYarnSetIndex,
    });
    setSelectedOriginalYarnRole(null);
  };

  if (patternDetailQuery.isPending) {
    return (
      <MobileShell surfaceClassName="pb-20">
          <TopBar
            left="back"
            onLeftClick={() => router.back()}
            showBottomBorder
            right={[
              { type: "chat", href: "/chats", ariaLabel: "채팅" },
              { type: "profile", href: profileHref, ariaLabel: "프로필" },
            ]}
          />

          <StateBlock type="loading" title="도안 정보를 불러오고 있어요." className="px-4 py-16" />
      </MobileShell>
    );
  }

  if (!pattern) {
    const errorMessage =
      isApiError(patternDetailQuery.error, 404)
        ? "요청하신 도안을 찾을 수 없어요."
        : "잠시 후 다시 시도해주세요.";

    return (
      <MobileShell surfaceClassName="pb-20">
          <TopBar
            left="back"
            onLeftClick={() => router.back()}
            showBottomBorder
            right={[
              { type: "chat", href: "/chats", ariaLabel: "채팅" },
              { type: "profile", href: profileHref, ariaLabel: "프로필" },
            ]}
          />

          <StateBlock
            type="error"
            title="도안 정보를 불러오지 못했어요."
            description={errorMessage}
            className="px-4 py-16"
          />
      </MobileShell>
    );
  }

  return (
    <>
      <MobileShell surfaceClassName="pb-28">
        <TopBar
          left="back"
          onLeftClick={() => router.back()}
          showBottomBorder
          right={[
            { type: "chat", href: "/chats", ariaLabel: "채팅" },
            { type: "profile", href: profileHref, ariaLabel: "프로필" },
          ]}
        />

        <section>
          <div className="relative mb-4 aspect-[5/4] w-full overflow-hidden">
            <Image
              src={pattern.image}
              alt={`${pattern.title} hero image`}
              fill
              className="object-cover"
            />
          </div>
        </section>

        <section className="px-4">
          <div className="flex items-center justify-between gap-3">
            <h1 className="min-w-0 flex-1 text-xl font-black tracking-tight">{pattern.title}</h1>
            <button
              type="button"
              onClick={handleScrapClick}
              disabled={toggleScrapMutation.isPending}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full disabled:cursor-not-allowed disabled:opacity-60"
              aria-label={isScrapped ? "찜 해제" : "찜 추가"}
              aria-pressed={isScrapped}
            >
              <HeartIcon
                variant={isScrapped ? "filled" : "outline"}
                className={
                  isScrapped
                    ? "h-6 w-6 stroke-ufo-brand fill-ufo-brand"
                    : "h-6 w-6 stroke-ufo-brand"
                }
              />
            </button>
          </div>
          <p className="mt-1 text-sm font-medium text-ufo-text-neutral">{pattern.author}</p>
          <p className="mt-1 text-xs text-ufo-text-dim">
            조회 {pattern.stats.views} · 찜 {scrapCount}
          </p>
        </section>

        <section className="mt-5 px-4">
          <button
            type="button"
            onClick={handleChatRoomClick}
            disabled={isResolvingChatPurchase || purchaseAccessMutation.isPending}
            className="flex h-10 w-full items-center justify-center rounded-xl border border-ufo-brand bg-ufo-brand-pale px-3 text-sm font-bold text-ufo-text-secondary disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="flex items-center gap-2 pb-0.5">
              <span>채팅방 입장하기</span>
              {shouldShowChatCreditBadge ? (
                <CreditBadge
                  credits={patternAccessCredits}
                  className="bg-transparent text-ufo-credit"
                  circleClassName="text-ufo-credit"
                  starClassName="text-ufo-surface"
                />
              ) : null}
            </span>
          </button>
        </section>

        <section className="mt-6 px-4">
          <DetailTabSwitch value={activeTab} onChange={setActiveTab} />

          <div className="mt-4">
            {activeTab === "description" ? (
              <div className="overflow-hidden border border-ufo-text-muted/30 bg-ufo-brand-pale">
                {detailRows.map((row) => (
                  <div
                    key={row.key}
                    className="grid min-h-[63px] grid-cols-[104px_1fr] border-t border-ufo-text-muted/30 first:border-t-0"
                  >
                    <div className="flex items-center px-4 text-sm font-bold text-ufo-text">
                      {row.label}
                    </div>
                    <div className="flex items-center justify-end px-4 text-sm font-semibold text-ufo-text-dim">
                      {pattern.details[row.key]}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <AlternativeYarnSection title="원작실">
                  {activeOriginalYarnSet ? (
                    <>
                      <OriginalYarnSelector
                        activeYarnSet={activeOriginalYarnSet}
                        originalYarnSets={originalYarnSets}
                        onOpen={setSelectedOriginalYarnRole}
                      />
                      <OriginalYarnSetCards yarnSet={activeOriginalYarnSet} />
                    </>
                  ) : (
                    <AlternativeSectionMessage>
                      등록된 원작실 정보가 없어요.
                    </AlternativeSectionMessage>
                  )}
                </AlternativeYarnSection>

                <AlternativeYarnSection title="UFO 추천 대체실 순위">
                  {isResolvingAlternativePurchase ? (
                    <AlternativeSectionMessage>
                      구매 정보를 확인하고 있어요.
                    </AlternativeSectionMessage>
                  ) : hasAlternativePurchase ? (
                    activeOriginalYarnSetId === null ? (
                      <AlternativeSectionMessage>
                        대체실 정보를 조회할 원작실 세트가 없어요.
                      </AlternativeSectionMessage>
                    ) : patternAlternativesQuery.isPending ? (
                      <AlternativeSectionMessage>
                        대체실 정보를 불러오고 있어요.
                      </AlternativeSectionMessage>
                    ) : patternAlternativesQuery.isError ? (
                      <AlternativeSectionMessage>
                        대체실 정보를 불러오지 못했어요. 잠시 후 다시 시도해주세요.
                      </AlternativeSectionMessage>
                    ) : visibleAlternativeSets.length > 0 ? (
                      <RankedAlternativeYarnGroups
                        key={activeOriginalYarnSetId}
                        sets={visibleAlternativeSets}
                      />
                    ) : (
                      <AlternativeSectionMessage>
                        등록된 대체실 정보가 아직 없어요.
                      </AlternativeSectionMessage>
                    )
                  ) : (
                    <AlternativePurchaseGate
                      credits={patternAccessCredits}
                      disabled={purchaseAccessMutation.isPending}
                      onPurchaseClick={handleAlternativePurchaseClick}
                    />
                  )}
                </AlternativeYarnSection>
              </div>
            )}
          </div>
        </section>
      </MobileShell>

      {isPurchaseDialogOpen ? (
        <YesOrNo
          mainText={purchaseDialogTitle}
          subText={
            <>
              <span className="block">현재 크레딧 {currentCreditText}</span>
              <span className="block">필요 크레딧 {patternAccessCredits} 크레딧</span>
              {purchaseErrorMessage ? (
                <span className="mt-2 block text-ufo-error">{purchaseErrorMessage}</span>
              ) : null}
            </>
          }
          yesLabel={purchaseAccessMutation.isPending ? "처리 중..." : "예"}
          yesDisabled={purchaseAccessMutation.isPending}
          noDisabled={purchaseAccessMutation.isPending}
          onNo={() => {
            if (purchaseAccessMutation.isPending) {
              return;
            }

            setPurchaseErrorMessage(null);
            setPurchaseDialogType(null);
          }}
          onYes={() => {
            setPurchaseErrorMessage(null);
            purchaseAccessMutation.mutate({
              type: purchaseDialogType === "alternative" ? "yarn" : "chat",
            });
          }}
        />
      ) : null}
      {selectedOriginalYarnRole && selectedOriginalYarnOptions.length > 0 ? (
        <OriginalYarnSelectSheet
          role={selectedOriginalYarnRole}
          options={selectedOriginalYarnOptions}
          onSelect={handleOriginalYarnSelect}
          onClose={() => setSelectedOriginalYarnRole(null)}
        />
      ) : null}
      <ToastMessage message={toastMessage} />
    </>
  );
}
