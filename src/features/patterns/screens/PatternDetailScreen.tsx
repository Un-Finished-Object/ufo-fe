"use client";

import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { type ReactNode, useEffect, useRef, useState } from "react";
import ToastMessage from "@/components/common/ToastMessage";
import CreditBadge from "@/components/credits/CreditBadge";
import YesOrNo from "@/components/dialogs/YesOrNo";
import HeartIcon from "@/components/icons/HeartIcon";
import TopBar from "@/components/navigation/TopBar";
import { userQueryKeys } from "@/features/auth/queries/userQueries";
import { useAuthState } from "@/features/auth/hooks/useAuthState";
import { useWalletQuery } from "@/features/auth/hooks/useWalletQuery";
import { myChatRoomsQueryKey } from "@/features/chat/queries/chatQueries";
import { myActivityQueryKeys } from "@/features/my/queries/myActivityQueries";
import {
  patternAlternativesQueryKey,
  patternAlternativesQueryOptions,
  type PatternAlternativeItem,
} from "@/features/patterns/queries/patternAlternativeQueries";
import type { OriginalYarnSet } from "@/features/patterns/queries/patternDetailQueries";
import {
  patternPurchaseQueryKey,
  patternPurchaseStatusQueryOptions,
  purchasePatternAccess,
  type PatternPurchaseType,
  type PatternPurchaseStatus,
} from "@/features/patterns/queries/patternPurchaseQueries";
import { patternDetailQueryOptions } from "@/features/patterns/queries/patternDetailQueries";
import {
  yarnDetailQueryOptions,
  type YarnDetailData,
} from "@/features/patterns/queries/yarnDetailQueries";
import { syncPatternScrapCaches } from "@/features/patterns/lib/syncPatternScrapCaches";
import { updatePatternScrap } from "@/features/patterns/services/updatePatternScrap";
import { useAuthRequiredToast } from "@/hooks/useAuthRequiredToast";
import { isApiError } from "@/lib/api/ApiError";

type PatternDetailScreenProps = {
  patternId: number;
};

type OriginalYarnPagerState = {
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
const patternAccessCredits = 10;

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
          <p className="text-l leading-[1.25] tracking-[-0.02em] text-ufo-text">
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

type YarnInfoCardData = {
  yarnName: string;
  subComponent?: string;
  cost?: number | null;
  detailItems?: YarnInfoDetailItem[];
};

function getAlternativeDetailItems(item: PatternAlternativeItem): YarnInfoDetailItem[] {
  return [
    { label: "무게", value: formatAlternativeNumber(item.weight, "g") },
    { label: "길이", value: formatAlternativeNumber(item.length, "m") },
    { label: "구매처", value: getAlternativeText(item.store) },
    { label: "작성자", value: getAlternativeText(item.username) },
  ].filter((detail): detail is { label: string; value: string } => detail.value !== null);
}

function hasVisibleAlternativeInfo(item: PatternAlternativeItem) {
  return (
    getAlternativeText(item.yarnName) !== null ||
    getAlternativeText(item.subComponent) !== null ||
    formatAlternativeNumber(item.cost, "원") !== null ||
    getAlternativeDetailItems(item).length > 0
  );
}

function getAlternativeCardData(item: PatternAlternativeItem): YarnInfoCardData {
  return {
    yarnName: item.yarnName,
    subComponent: item.subComponent,
    cost: item.cost,
    detailItems: getAlternativeDetailItems(item),
  };
}

function YarnInfoCard({ card }: { card: YarnInfoCardData }) {
  const yarnName = getAlternativeText(card.yarnName);
  const subComponent = card.subComponent ? getAlternativeText(card.subComponent) : null;
  const cost = formatAlternativeNumber(card.cost ?? null, "원");
  const detailItems = card.detailItems ?? [];
  const hasHeaderContent = yarnName !== null || subComponent !== null || cost !== null;

  return (
    <article className="rounded-xl border border-ufo-border bg-white px-3 py-2.5">
      {hasHeaderContent ? (
        <div className="flex items-start justify-between gap-2.5">
          {yarnName || subComponent ? (
            <div className="min-w-0 flex-1">
              {yarnName ? (
                <p className="break-words text-sm font-bold leading-5 text-ufo-text">{yarnName}</p>
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
    </article>
  );
}

function ChevronLeftIcon() {
  return (
    <svg
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-4 w-4"
    >
      <path
        fillRule="evenodd"
        d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-4 w-4"
    >
      <path
        fillRule="evenodd"
        d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function getOriginalYarnIds(originalYarnSets: OriginalYarnSet[]) {
  const yarnIds = new Set<number>();

  originalYarnSets.forEach((yarnSet) => {
    yarnIds.add(yarnSet.firstYarnId);

    if (yarnSet.secondYarnId !== null) {
      yarnIds.add(yarnSet.secondYarnId);
    }

    if (yarnSet.subYarnId !== null) {
      yarnIds.add(yarnSet.subYarnId);
    }
  });

  return Array.from(yarnIds);
}

function getOriginalYarnEntries(yarnSet: OriginalYarnSet) {
  if (yarnSet.secondYarnId !== null) {
    return [
      { label: "메인실", yarnId: yarnSet.firstYarnId },
      { label: "배색실", yarnId: yarnSet.secondYarnId },
    ];
  }

  if (yarnSet.subYarnId !== null) {
    return [
      { label: "메인실", yarnId: yarnSet.firstYarnId },
      { label: "합사실", yarnId: yarnSet.subYarnId },
    ];
  }

  return [{ label: "원작실", yarnId: yarnSet.firstYarnId }];
}

function getYarnDetailItems(yarn: YarnDetailData): YarnInfoDetailItem[] {
  return [
    { label: "무게", value: formatAlternativeNumber(yarn.weight, "g") },
    { label: "길이", value: formatAlternativeNumber(yarn.length, "m") },
    { label: "구매처", value: getAlternativeText(yarn.store) },
  ].filter((detail): detail is YarnInfoDetailItem => detail.value !== null);
}

function getYarnCardData(yarn: YarnDetailData): YarnInfoCardData {
  return {
    yarnName: yarn.yarnName,
    subComponent: yarn.component,
    cost: yarn.cost,
    detailItems: getYarnDetailItems(yarn),
  };
}

type YarnDetailQueryState = {
  data?: YarnDetailData;
  isPending: boolean;
  isError: boolean;
};

function OriginalYarnCard({
  queryState,
}: {
  queryState?: YarnDetailQueryState;
}) {
  return (
    <div>
      {!queryState || queryState.isPending ? (
        <AlternativeSectionMessage>
          원작실 정보를 불러오고 있어요.
        </AlternativeSectionMessage>
      ) : queryState.isError || !queryState.data ? (
        <AlternativeSectionMessage>
          원작실 정보를 불러오지 못했어요. 잠시 후 다시 시도해주세요.
        </AlternativeSectionMessage>
      ) : (
        <YarnInfoCard card={getYarnCardData(queryState.data)} />
      )}
    </div>
  );
}

function OriginalYarnSetControls({
  currentIndex,
  total,
  onPrevious,
  onNext,
}: {
  currentIndex: number;
  total: number;
  onPrevious: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex shrink-0 items-center gap-1">
      <button
        type="button"
        onClick={onPrevious}
        disabled={currentIndex === 0}
        className="flex h-7 w-7 items-center justify-center rounded-full border border-ufo-border-light bg-white text-ufo-text-secondary disabled:cursor-not-allowed disabled:opacity-35"
        aria-label="이전 원작실 세트"
      >
        <ChevronLeftIcon />
      </button>
      <span className="min-w-9 text-center text-xs font-bold text-ufo-text-secondary">
        {currentIndex + 1} / {total}
      </span>
      <button
        type="button"
        onClick={onNext}
        disabled={currentIndex >= total - 1}
        className="flex h-7 w-7 items-center justify-center rounded-full border border-ufo-border-light bg-white text-ufo-text-secondary disabled:cursor-not-allowed disabled:opacity-35"
        aria-label="다음 원작실 세트"
      >
        <ChevronRightIcon />
      </button>
    </div>
  );
}

function OriginalYarnSetCards({
  yarnSet,
  yarnQueryStateMap,
}: {
  yarnSet: OriginalYarnSet;
  yarnQueryStateMap: Map<number, YarnDetailQueryState>;
}) {
  return (
    <div className="space-y-3">
      {getOriginalYarnEntries(yarnSet).map((entry) => (
        <OriginalYarnCard
          key={`${entry.label}-${entry.yarnId}`}
          queryState={yarnQueryStateMap.get(entry.yarnId)}
        />
      ))}
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
        <h3 className="text-sm font-bold text-ufo-text">{title}</h3>
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
  const [originalYarnPagerState, setOriginalYarnPagerState] =
    useState<OriginalYarnPagerState>({
      patternId: null,
      index: 0,
    });
  const [purchaseDialogType, setPurchaseDialogType] = useState<PurchaseDialogType | null>(null);
  const [purchaseErrorMessage, setPurchaseErrorMessage] = useState<string | null>(null);
  const profileHref = isAuthenticated ? "/my" : "/login";
  const isScrapped = pattern?.isScrapped ?? false;
  const scrapCount = pattern?.stats.scraps ?? 0;
  const originalYarnSets = pattern?.originalYarnSets ?? [];
  const originalYarnPagerPatternId = pattern?.id ?? null;
  const requestedOriginalYarnSetIndex =
    originalYarnPagerState.patternId === originalYarnPagerPatternId
      ? originalYarnPagerState.index
      : 0;
  const activeOriginalYarnSetIndex = Math.min(
    requestedOriginalYarnSetIndex,
    Math.max(originalYarnSets.length - 1, 0),
  );
  const originalYarnIds = getOriginalYarnIds(originalYarnSets);
  const originalYarnQueries = useQueries({
    queries: originalYarnIds.map((yarnId) => yarnDetailQueryOptions(yarnId)),
  });
  const yarnQueryStateMap = new Map<number, YarnDetailQueryState>();

  originalYarnIds.forEach((yarnId, yarnIndex) => {
    const query = originalYarnQueries[yarnIndex];

    if (!query) {
      return;
    }

    yarnQueryStateMap.set(yarnId, {
      data: query.data,
      isPending: query.isPending,
      isError: query.isError,
    });
  });

  const purchaseStatusQuery = useQuery({
    ...patternPurchaseStatusQueryOptions(pattern?.id ?? 0),
    enabled: authStatus !== "loading" && isAuthenticated && pattern !== null,
  });
  const hasChatPurchase = purchaseStatusQuery.data?.chat === true;
  const purchasedChatroomId = purchaseStatusQuery.data?.chatroomId ?? null;
  const hasAlternativePurchase = purchaseStatusQuery.data?.alternative === true;
  const patternAlternativesQuery = useQuery({
    ...patternAlternativesQueryOptions(pattern?.id ?? 0),
    enabled:
      authStatus !== "loading" &&
      isAuthenticated &&
      pattern !== null &&
      hasAlternativePurchase,
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
  const visibleAlternativeItems =
    patternAlternativesQuery.data?.filter(hasVisibleAlternativeInfo) ?? [];

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
            queryKey: patternAlternativesQueryKey(pattern.id),
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

  if (patternDetailQuery.isPending) {
    return (
      <div className="min-h-screen bg-ufo-bg">
        <main className="mx-auto min-h-screen w-full max-w-[430px] bg-ufo-surface pb-20 text-ufo-text">
          <TopBar
            left="back"
            onLeftClick={() => router.back()}
            showBottomBorder
            right={[
              { type: "chat", href: "/chats", ariaLabel: "채팅" },
              { type: "profile", href: profileHref, ariaLabel: "프로필" },
            ]}
          />

          <section className="px-4 py-16">
            <div className="rounded-2xl border border-ufo-border bg-white px-5 py-10 text-center">
              <p className="text-base font-semibold text-ufo-text">도안 정보를 불러오고 있어요.</p>
            </div>
          </section>
        </main>
      </div>
    );
  }

  if (!pattern) {
    const errorMessage =
      isApiError(patternDetailQuery.error, 404)
        ? "요청하신 도안을 찾을 수 없어요."
        : "잠시 후 다시 시도해주세요.";

    return (
      <div className="min-h-screen bg-ufo-bg">
        <main className="mx-auto min-h-screen w-full max-w-[430px] bg-ufo-surface pb-20 text-ufo-text">
          <TopBar
            left="back"
            onLeftClick={() => router.back()}
            showBottomBorder
            right={[
              { type: "chat", href: "/chats", ariaLabel: "채팅" },
              { type: "profile", href: profileHref, ariaLabel: "프로필" },
            ]}
          />

          <section className="px-4 py-16">
            <div className="rounded-2xl border border-ufo-border bg-white px-5 py-10 text-center">
              <p className="text-base font-semibold text-ufo-text">도안 정보를 불러오지 못했어요.</p>
              <p className="mt-2 text-sm text-ufo-text-secondary">{errorMessage}</p>
            </div>
          </section>
        </main>
      </div>
    );
  }

  const activeOriginalYarnSet = originalYarnSets[activeOriginalYarnSetIndex] ?? null;

  return (
    <div className="min-h-screen bg-ufo-bg">
      <main className="mx-auto min-h-screen w-full max-w-[430px] bg-ufo-surface pb-28 text-ufo-text">
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
                <AlternativeYarnSection
                  title="원작실"
                  action={
                    originalYarnSets.length > 1 ? (
                      <OriginalYarnSetControls
                        currentIndex={activeOriginalYarnSetIndex}
                        total={originalYarnSets.length}
                        onPrevious={() => {
                          setOriginalYarnPagerState({
                            patternId: originalYarnPagerPatternId,
                            index: Math.max(activeOriginalYarnSetIndex - 1, 0),
                          });
                        }}
                        onNext={() => {
                          setOriginalYarnPagerState({
                            patternId: originalYarnPagerPatternId,
                            index: Math.min(
                              activeOriginalYarnSetIndex + 1,
                              originalYarnSets.length - 1,
                            ),
                          });
                        }}
                      />
                    ) : null
                  }
                >
                  {activeOriginalYarnSet ? (
                    <OriginalYarnSetCards
                      yarnSet={activeOriginalYarnSet}
                      yarnQueryStateMap={yarnQueryStateMap}
                    />
                  ) : (
                    <AlternativeSectionMessage>
                      등록된 원작실 정보가 없어요.
                    </AlternativeSectionMessage>
                  )}
                </AlternativeYarnSection>

                <AlternativeYarnSection
                  title="UFO 등록 대체실"
                  action={
                    hasAlternativePurchase ? (
                      <button
                        type="button"
                        onClick={() => {
                          void patternAlternativesQuery.refetch();
                        }}
                        disabled={patternAlternativesQuery.isFetching}
                        className="shrink-0 rounded-full border border-ufo-border-light bg-white px-2.5 py-1 text-xs font-semibold text-ufo-text-secondary disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        새로고침
                      </button>
                    ) : null
                  }
                >
                  {isResolvingAlternativePurchase ? (
                    <AlternativeSectionMessage>
                      구매 정보를 확인하고 있어요.
                    </AlternativeSectionMessage>
                  ) : hasAlternativePurchase ? (
                    patternAlternativesQuery.isPending ? (
                      <AlternativeSectionMessage>
                        대체실 정보를 불러오고 있어요.
                      </AlternativeSectionMessage>
                    ) : patternAlternativesQuery.isError ? (
                      <AlternativeSectionMessage>
                        대체실 정보를 불러오지 못했어요. 잠시 후 다시 시도해주세요.
                      </AlternativeSectionMessage>
                    ) : visibleAlternativeItems.length > 0 ? (
                      <div className="space-y-2">
                        {visibleAlternativeItems.map((item, itemIndex) => (
                          <YarnInfoCard
                            key={item.altId ?? `${item.yarnId ?? "unknown"}-${itemIndex}`}
                            card={getAlternativeCardData(item)}
                          />
                        ))}
                      </div>
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

                <AlternativeYarnSection title="사용자 등록 대체실">
                  <AlternativeSectionMessage>
                    등록된 사용자 대체실 정보가 아직 없어요.
                  </AlternativeSectionMessage>
                </AlternativeYarnSection>
              </div>
            )}
          </div>
        </section>
      </main>

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
      <ToastMessage message={toastMessage} />
    </div>
  );
}
