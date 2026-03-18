"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import SegmentedSwitch from "@/components/common/SegmentedSwitch";
import CreditBadge from "@/components/credits/CreditBadge";
import YesOrNo from "@/components/dialogs/YesOrNo";
import TopBar from "@/components/navigation/TopBar";
import { userQueryKeys } from "@/features/auth/queries/userQueries";
import { useAuthState } from "@/features/auth/hooks/useAuthState";
import { useWalletQuery } from "@/features/auth/hooks/useWalletQuery";
import { myChatRoomsQueryKey } from "@/features/chat/hooks/useMyChatRoomsQuery";
import {
  patternPurchaseQueryKey,
  patternPurchaseStatusQueryOptions,
  purchasePatternAccess,
  type PatternPurchaseStatus,
} from "@/features/patterns/queries/patternPurchaseQueries";

export type PatternDetailData = {
  id: number;
  title: string;
  author: string;
  credits: number;
  image: string;
  isScrapped: boolean;
  stats: {
    views: number;
    scraps: number;
  };
  details: {
    category: string;
    size: string;
    measurement: string;
    needle: string;
    yarn: string;
    amount: string;
    gauge: string;
  };
};

type PatternDetailScreenProps = {
  pattern: PatternDetailData | null;
  errorMessage?: string | null;
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

const detailTabOptions = [
  { label: "상세정보", value: "description" },
  { label: "대체실정보", value: "alternative" },
] as const;

export default function PatternDetailScreen({
  pattern,
  errorMessage = null,
}: PatternDetailScreenProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { authStatus, isAuthenticated } = useAuthState();
  const walletQuery = useWalletQuery({ enabled: isAuthenticated && pattern !== null });
  const [activeTab, setActiveTab] = useState<"description" | "alternative">("description");
  const [isPurchaseDialogOpen, setIsPurchaseDialogOpen] = useState(false);
  const [purchaseErrorMessage, setPurchaseErrorMessage] = useState<string | null>(null);
  const profileHref = isAuthenticated ? "/my" : "/login";
  const purchaseStatusQuery = useQuery({
    ...patternPurchaseStatusQueryOptions(pattern?.id ?? 0),
    enabled: authStatus !== "loading" && isAuthenticated && pattern !== null,
  });
  const hasChatPurchase = purchaseStatusQuery.data?.chat === true;
  const isResolvingChatPurchase =
    pattern === null ||
    authStatus === "loading" ||
    (isAuthenticated && purchaseStatusQuery.isPending);
  const shouldShowChatCreditBadge =
    pattern !== null && authStatus !== "loading" && !hasChatPurchase;
  const currentCreditText = walletQuery.isPending
    ? "불러오는 중..."
    : `${walletQuery.data ?? 0} 크레딧`;

  const purchaseChatMutation = useMutation({
    mutationFn: () => purchasePatternAccess({ patternId: pattern?.id ?? 0, type: 1 }),
    onSuccess: (data) => {
      if (!pattern) {
        return;
      }

      queryClient.setQueryData<PatternPurchaseStatus | null>(
        patternPurchaseQueryKey(pattern.id),
        (previous) => ({
          userId: data.userId ?? previous?.userId ?? null,
          chat: true,
          alternative: previous?.alternative ?? false,
        }),
      );
      void queryClient.invalidateQueries({ queryKey: userQueryKeys.wallet });
      void queryClient.invalidateQueries({ queryKey: myChatRoomsQueryKey });
      setPurchaseErrorMessage(null);
      setIsPurchaseDialogOpen(false);
    },
    onError: (error) => {
      if (error instanceof Error && error.message === "Unauthorized") {
        setIsPurchaseDialogOpen(false);
        router.replace("/login?error=unauthorized");
        return;
      }

      setPurchaseErrorMessage("채팅방 구매에 실패했어요. 잠시 후 다시 시도해주세요.");
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
    setIsPurchaseDialogOpen(true);
  };

  if (!pattern) {
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
              <p className="mt-2 text-sm text-ufo-text-secondary">
                {errorMessage ?? "잠시 후 다시 시도해주세요."}
              </p>
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
          <h1 className="text-xl font-black tracking-tight">{pattern.title}</h1>
          <p className="mt-1 text-sm font-medium text-ufo-text-neutral">{pattern.author}</p>
          <p className="mt-1 text-xs text-ufo-text-dim">
            조회 {pattern.stats.views} · 찜 {pattern.stats.scraps}
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
                disabled={isResolvingChatPurchase || purchaseChatMutation.isPending}
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
          <SegmentedSwitch
            options={detailTabOptions}
            value={activeTab}
            onChange={setActiveTab}
          />

          <div className="mt-4">
            {activeTab === "description" ? (
              <div className="overflow-hidden border-b">
                {detailRows.map((row) => (
                  <div
                    key={row.key}
                    className="grid grid-cols-[104px_1fr] border-t bg-ufo-brand-pale last:border-b-0"
                  >
                    <div className="flex min-h-[52px] items-center px-4 text-sm font-bold text-ufo-text">
                      {row.label}
                    </div>
                    <div className="flex min-h-[52px] items-center justify-end px-4 text-sm font-semibold text-ufo-text-dim">
                      {pattern.details[row.key]}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl bg-ufo-brand-pale p-4 text-sm text-ufo-text-secondary">
                대체실정보는 추후 API 연동 후 제공될 예정입니다.
              </div>
            )}
          </div>
        </section>
      </main>

      {isPurchaseDialogOpen ? (
        <YesOrNo
          mainText="채팅방에 입장하시겠습니까?"
          subText={
            <>
              <span className="block">현재 크레딧 {currentCreditText}</span>
              <span className="block">필요 크레딧 {pattern.credits} 크레딧</span>
              {purchaseErrorMessage ? (
                <span className="mt-2 block text-ufo-error">{purchaseErrorMessage}</span>
              ) : null}
            </>
          }
          yesLabel={purchaseChatMutation.isPending ? "처리 중..." : "예"}
          yesDisabled={purchaseChatMutation.isPending}
          noDisabled={purchaseChatMutation.isPending}
          onNo={() => {
            if (purchaseChatMutation.isPending) {
              return;
            }

            setPurchaseErrorMessage(null);
            setIsPurchaseDialogOpen(false);
          }}
          onYes={() => {
            setPurchaseErrorMessage(null);
            purchaseChatMutation.mutate();
          }}
        />
      ) : null}
    </div>
  );
}
