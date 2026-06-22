"use client";

import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";
import ToastMessage from "@/components/common/ToastMessage";
import Pagination from "@/components/common/Pagination";
import TopBar from "@/components/navigation/TopBar";
import { useMeQuery } from "@/features/auth/hooks/useMeQuery";
import {
  myPurchasedProjectsQueryOptions,
  type PurchasedProjectItem,
} from "@/features/my/queries/myActivityQueries";
import { useAuthRequiredToast } from "@/hooks/useAuthRequiredToast";
import { isApiError } from "@/lib/api/ApiError";

type MyActivityScreenProps = {
  initialPage: number;
};

function formatPurchaseDate(value: string | null) {
  if (!value) {
    return "구매 완료";
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return "구매 완료";
  }

  const year = parsedDate.getFullYear();
  const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
  const day = String(parsedDate.getDate()).padStart(2, "0");

  return `${year}. ${month}. ${day} 구매`;
}

function CreditDot() {
  return <span aria-hidden="true" className="mt-0.5 h-2.5 w-2.5 rounded-full bg-ufo-credit" />;
}

function LoadingState() {
  return (
    <section className="px-4 py-12">
      <div className="flex flex-col items-center justify-center rounded-2xl border border-ufo-border bg-white px-6 py-12 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-ufo-border-light border-t-ufo-brand-pale" />
        <p className="mt-4 text-sm font-medium text-ufo-text-secondary">
          구매한 프로젝트를 불러오고 있어요.
        </p>
      </div>
    </section>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <section className="px-4 py-12">
      <div className="rounded-2xl border border-ufo-border bg-white px-6 py-10 text-center">
        <p className="text-base font-semibold text-ufo-text">구매한 프로젝트를 불러오지 못했어요.</p>
        <p className="mt-2 text-sm text-ufo-text-secondary">
          잠시 후 다시 시도하거나 새로고침해 주세요.
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-5 rounded-xl bg-ufo-brand-soft px-4 py-2 text-sm font-semibold text-white"
        >
          다시 시도
        </button>
      </div>
    </section>
  );
}

function EmptyState() {
  return (
    <section className="px-4 py-12">
      <div className="rounded-2xl border border-ufo-border bg-white px-6 py-10 text-center">
        <p className="text-base font-semibold text-ufo-text">구매한 프로젝트가 아직 없어요.</p>
        <p className="mt-2 text-sm text-ufo-text-secondary">
          프로젝트를 구매하면 이곳에서 채팅방과 대체실 정보를 확인할 수 있어요.
        </p>
      </div>
    </section>
  );
}

function ActivityActionButton({
  label,
  disabled,
  onClick,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex h-8 items-center justify-center rounded-md bg-white text-[12px] font-medium tracking-[-0.02em] text-ufo-brand disabled:cursor-not-allowed disabled:text-ufo-brand/35"
    >
      {label}
    </button>
  );
}

function PurchasedProjectCard({ item }: { item: PurchasedProjectItem }) {
  const router = useRouter();
  const purchasedAt = item.purchaseChatDate ?? item.purchaseYarnDate;
  const handleChatClick = useCallback(() => {
    if (item.purchaseChatId === null) {
      return;
    }

    router.push(`/chats/${item.purchaseChatId}`);
  }, [item.purchaseChatId, router]);
  const handleAlternativeClick = useCallback(() => {
    router.push(`/patterns/${item.patternId}`);
  }, [item.patternId, router]);
  const purchaseStatusText =
    item.chat && item.alternative
      ? "채팅방/대체실 구매"
      : item.chat
        ? "채팅방 구매"
        : item.alternative
          ? "대체실 구매"
          : "구매 완료";

  return (
    <article className="rounded-[14px] border border-ufo-border bg-ufo-brand-pale px-2.5 py-3">
      <div className="flex items-start gap-2.5">
        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-[10px] bg-ufo-surface">
          <Image
            src={item.image}
            alt={`${item.title} image`}
            fill
            className="object-cover"
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-[12px] font-semibold leading-[1.25] tracking-[-0.02em] text-ufo-text-subtle">
                {item.title}
              </p>
              <p className="mt-1 truncate text-[11px] leading-none text-ufo-text-secondary underline underline-offset-2">
                {item.authorName}
              </p>
            </div>

            <div className="shrink-0 text-right">
              <p className="text-[9px] leading-none text-ufo-text-secondary">
                {formatPurchaseDate(purchasedAt)}
              </p>
              <p className="mt-1 flex items-center justify-end gap-1 text-[10px] font-semibold leading-none text-ufo-credit">
                <CreditDot />
                <span>{purchaseStatusText}</span>
              </p>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <ActivityActionButton
              label="채팅방 바로가기"
              disabled={!item.chat}
              onClick={handleChatClick}
            />
            <ActivityActionButton
              label="대체실 정보 바로보기"
              disabled={!item.alternative}
              onClick={handleAlternativeClick}
            />
          </div>
        </div>
      </div>
    </article>
  );
}

export default function MyActivityScreen({ initialPage }: MyActivityScreenProps) {
  const router = useRouter();
  const { showAuthRequiredToast, toastMessage } = useAuthRequiredToast();
  const meQuery = useMeQuery();
  const purchasedProjectsQuery = useQuery(
    myPurchasedProjectsQueryOptions(initialPage, { enabled: Boolean(meQuery.data) }),
  );

  useEffect(() => {
    if (!meQuery.isPending && !meQuery.isError && !meQuery.data) {
      showAuthRequiredToast();
    }
  }, [meQuery.data, meQuery.isError, meQuery.isPending, showAuthRequiredToast]);

  useEffect(() => {
    if (isApiError(purchasedProjectsQuery.error, 401)) {
      showAuthRequiredToast();
    }
  }, [purchasedProjectsQuery.error, showAuthRequiredToast]);

  const handleRetry = useCallback(() => {
    void meQuery.refetch();
    void purchasedProjectsQuery.refetch();
  }, [meQuery, purchasedProjectsQuery]);

  const handlePageChange = useCallback(
    (page: number) => {
      router.push(`/my/activity?page=${page}`);
    },
    [router],
  );

  const isLoading = meQuery.isPending || (Boolean(meQuery.data) && purchasedProjectsQuery.isPending);
  const isError =
    meQuery.isError ||
    (purchasedProjectsQuery.isError && !isApiError(purchasedProjectsQuery.error, 401));
  const purchasedProjects = purchasedProjectsQuery.data?.items ?? [];
  const currentPage = purchasedProjectsQuery.data?.page ?? initialPage;
  const nextPage = purchasedProjectsQuery.data?.nextPage ?? 0;

  return (
    <>
      <div className="min-h-screen bg-ufo-bg">
        <main className="mx-auto min-h-screen w-full max-w-[430px] bg-ufo-surface text-ufo-text">
        <TopBar
          left="back"
          leftHref="/my"
          title="나의 활동"
          right={[{ type: "home", href: "/", ariaLabel: "홈으로 이동" }]}
          showBottomBorder
        />

        <section className="border-b-2 border-ufo-border px-4 py-3 text-center">
          <h2 className="text-base font-semibold tracking-[-0.02em] text-ufo-brand">
            구매한 프로젝트
          </h2>
        </section>

        {isLoading ? <LoadingState /> : null}
        {isError ? <ErrorState onRetry={handleRetry} /> : null}
        {!isLoading && !isError && purchasedProjects.length === 0 ? <EmptyState /> : null}

        {!isLoading && !isError && purchasedProjects.length > 0 ? (
          <>
            <section className="px-4 py-6">
              <div className="space-y-9">
                {purchasedProjects.map((item) => (
                  <PurchasedProjectCard key={item.patternId} item={item} />
                ))}
              </div>
            </section>

            <Pagination
              currentPage={currentPage}
              nextPage={nextPage}
              onPageChange={handlePageChange}
            />
          </>
        ) : null}
        </main>
      </div>
      <ToastMessage message={toastMessage} />
    </>
  );
}
