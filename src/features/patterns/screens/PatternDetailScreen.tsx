"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import CreditBadge from "@/components/credits/CreditBadge";
import YesOrNo from "@/components/dialogs/YesOrNo";
import HeartIcon from "@/components/icons/HeartIcon";
import TopBar from "@/components/navigation/TopBar";
import { userQueryKeys } from "@/features/auth/queries/userQueries";
import { useAuthState } from "@/features/auth/hooks/useAuthState";
import { useWalletQuery } from "@/features/auth/hooks/useWalletQuery";
import { myChatRoomsQueryKey } from "@/features/chat/queries/chatQueries";
import {
  patternPurchaseQueryKey,
  patternPurchaseStatusQueryOptions,
  purchasePatternAccess,
  type PatternPurchaseType,
  type PatternPurchaseStatus,
} from "@/features/patterns/queries/patternPurchaseQueries";
import {
  PatternDetailQueryError,
  patternDetailQueryKey,
  patternDetailQueryOptions,
  type PatternDetailData,
} from "@/features/patterns/queries/patternDetailQueries";
import { updatePatternScrap } from "@/features/patterns/services/updatePatternScrap";

type PatternDetailScreenProps = {
  patternId: number;
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

export default function PatternDetailScreen({
  patternId,
}: PatternDetailScreenProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const patternDetailQuery = useQuery(patternDetailQueryOptions(patternId));
  const pattern = patternDetailQuery.data ?? null;
  const { authStatus, isAuthenticated } = useAuthState();
  const walletQuery = useWalletQuery({ enabled: isAuthenticated && pattern !== null });
  const [activeTab, setActiveTab] = useState<DetailTabValue>("alternative");
  const [purchaseDialogType, setPurchaseDialogType] = useState<PurchaseDialogType | null>(null);
  const [purchaseErrorMessage, setPurchaseErrorMessage] = useState<string | null>(null);
  const profileHref = isAuthenticated ? "/my" : "/login";
  const isScrapped = pattern?.isScrapped ?? false;
  const scrapCount = pattern?.stats.scraps ?? 0;
  const purchaseStatusQuery = useQuery({
    ...patternPurchaseStatusQueryOptions(pattern?.id ?? 0),
    enabled: authStatus !== "loading" && isAuthenticated && pattern !== null,
  });
  const hasChatPurchase = purchaseStatusQuery.data?.chat === true;
  const hasAlternativePurchase = purchaseStatusQuery.data?.alternative === true;
  const isResolvingChatPurchase =
    pattern === null ||
    authStatus === "loading" ||
    (isAuthenticated && purchaseStatusQuery.isPending);
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
      queryClient.setQueryData<PatternDetailData | undefined>(
        patternDetailQueryKey(patternId),
        (previous) =>
          previous
            ? {
                ...previous,
                isScrapped: result.scrapped,
                stats: {
                  ...previous.stats,
                  scraps: result.scrapCount,
                },
              }
            : previous,
      );
    },
    onError: (error) => {
      if (error.message === "Unauthorized") {
        router.push("/login?toast=auth_required");
      }
    },
  });

  const purchaseAccessMutation = useMutation({
    mutationFn: ({ type }: { type: PatternPurchaseType }) =>
      purchasePatternAccess({ patternId: pattern?.id ?? 0, type }),
    onSuccess: (data) => {
      if (!pattern) {
        return;
      }

      queryClient.setQueryData<PatternPurchaseStatus | null>(
        patternPurchaseQueryKey(pattern.id),
        (previous) => ({
          userId: data.userId ?? previous?.userId ?? null,
          chat: data.type === 1 ? true : previous?.chat ?? false,
          alternative: data.type === 2 ? true : previous?.alternative ?? false,
        }),
      );
      void queryClient.invalidateQueries({ queryKey: userQueryKeys.wallet });
      if (data.type === 1) {
        void queryClient.invalidateQueries({ queryKey: myChatRoomsQueryKey });
      }
      setPurchaseErrorMessage(null);
      setPurchaseDialogType(null);
    },
    onError: (error) => {
      if (error instanceof Error && error.message === "Unauthorized") {
        setPurchaseDialogType(null);
        router.replace("/login?error=unauthorized");
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
      router.push("/login?toast=auth_required");
      return;
    }

    if (hasChatPurchase) {
      router.push(`/chats/${pattern.id}`);
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
      router.push("/login?toast=auth_required");
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
      router.push("/login?toast=auth_required");
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
      patternDetailQuery.error instanceof PatternDetailQueryError &&
      patternDetailQuery.error.status === 404
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
          <article className="flex h-[184px] flex-col rounded-2xl border border-ufo-brand bg-white p-4">
            <div className="flex items-center gap-2 border-b border-ufo-border-light pb-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="currentColor"
                className="bi bi-chat-right-text text-ufo-text-neutral"
                viewBox="0 0 16 16"
              >
                <path d="M2 1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h9.586a2 2 0 0 1 1.414.586l2 2V2a1 1 0 0 0-1-1zm12-1a2 2 0 0 1 2 2v12.793a.5.5 0 0 1-.854.353l-2.853-2.853a1 1 0 0 0-.707-.293H2a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2z" />
                <path d="M3 3.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5M3 6a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9A.5.5 0 0 1 3 6m0 2.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5" />
              </svg>
              <h2 className="truncate text-sm text-ufo-text-neutral">{pattern.title} 실시간 채팅방</h2>
            </div>

            <div className="mt-3">
              <div
                className="max-h-[72px] space-y-3 overflow-y-auto"
                aria-label="실시간 채팅 미리보기"
              >
                <div className="flex items-center gap-2">
                  <span className="h-9 w-9 rounded-full bg-ufo-brand-pale" aria-hidden="true" />
                  <span className="h-7 w-[132px] rounded-xl bg-ufo-border" aria-hidden="true" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-9 w-9 rounded-full bg-ufo-brand" aria-hidden="true" />
                  <span className="h-7 w-[132px] rounded-xl bg-ufo-border" aria-hidden="true" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-9 w-9 rounded-full bg-ufo-brand-pale" aria-hidden="true" />
                  <span className="h-7 w-[120px] rounded-xl bg-ufo-border" aria-hidden="true" />
                </div>
              </div>
            </div>

            <div className="mt-3">
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
                      credits={pattern.credits}
                      className="bg-transparent text-ufo-credit"
                      circleClassName="text-ufo-credit"
                      starClassName="text-ufo-surface"
                    />
                  ) : null}
                </span>
              </button>
            </div>
          </article>
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
            ) : isResolvingAlternativePurchase ? (
              <div className="rounded-xl bg-ufo-brand-pale p-4 text-sm text-ufo-text-secondary">
                구매 정보를 확인하고 있어요.
              </div>
            ) : hasAlternativePurchase ? (
              <div className="rounded-xl bg-ufo-brand-pale p-4 text-sm text-ufo-text-secondary">
                대체실정보는 추후 API 연동 후 제공될 예정입니다.
              </div>
            ) : (
              <AlternativePurchaseGate
                credits={pattern.credits}
                disabled={purchaseAccessMutation.isPending}
                onPurchaseClick={handleAlternativePurchaseClick}
              />
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
              <span className="block">필요 크레딧 {pattern.credits} 크레딧</span>
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
              type: purchaseDialogType === "alternative" ? 2 : 1,
            });
          }}
        />
      ) : null}
    </div>
  );
}
