"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";
import FilterChipGroup from "@/components/common/FilterChipGroup";
import Pagination from "@/components/common/Pagination";
import StateBlock from "@/components/common/StateBlock";
import ToastMessage from "@/components/common/ToastMessage";
import MobileShell from "@/components/layout/MobileShell";
import TopBar from "@/components/navigation/TopBar";
import { useMeQuery } from "@/features/auth/hooks/useMeQuery";
import {
  creditTransactionsQueryOptions,
  type CreditTransactionItem,
  type CreditTransactionReasonFilter,
  type CreditTransactionTypeFilter,
} from "@/features/my/queries/creditTransactionQueries";
import { useAuthRequiredToast } from "@/hooks/useAuthRequiredToast";
import { isApiError } from "@/lib/api/ApiError";

type CreditHistoryScreenProps = {
  initialPage: number;
  initialType: CreditTransactionTypeFilter;
  initialReason: CreditTransactionReasonFilter;
};

const typeFilterOptions = [
  { label: "전체", value: "all" },
  { label: "획득", value: "earn" },
  { label: "소비", value: "spend" },
  { label: "조정", value: "adjust" },
] satisfies Array<{ label: string; value: CreditTransactionTypeFilter }>;

const reasonFilterOptions = [
  { label: "전체", value: "all" },
  { label: "출석", value: "attendance" },
  { label: "채팅", value: "chat" },
] satisfies Array<{ label: string; value: CreditTransactionReasonFilter }>;

const transactionTypeLabels: Record<string, string> = {
  EARN: "획득",
  SPEND: "소비",
  ADJUST: "조정",
};

const transactionReasonLabels: Record<string, string> = {
  ATTENDANCE_DAILY: "출석",
  CHATROOM_ENTRY: "채팅방 입장",
  CHAT_ENTRY_FEE: "채팅방 입장",
};

function formatDateTime(value: string) {
  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  const year = parsedDate.getFullYear();
  const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
  const day = String(parsedDate.getDate()).padStart(2, "0");
  const hours = String(parsedDate.getHours()).padStart(2, "0");
  const minutes = String(parsedDate.getMinutes()).padStart(2, "0");

  return `${year}. ${month}. ${day} ${hours}:${minutes}`;
}

function formatAmount(item: CreditTransactionItem) {
  const normalizedType = item.type.toUpperCase();
  const absoluteAmount = Math.abs(item.amount);

  if (normalizedType === "EARN") {
    return `+${absoluteAmount}`;
  }

  if (normalizedType === "SPEND") {
    return `-${absoluteAmount}`;
  }

  return item.amount > 0 ? `+${absoluteAmount}` : `-${absoluteAmount}`;
}

function getAmountClassName(item: CreditTransactionItem) {
  const normalizedType = item.type.toUpperCase();

  if (normalizedType === "EARN") {
    return "text-ufo-brand";
  }

  if (normalizedType === "SPEND") {
    return "text-ufo-text";
  }

  return "text-ufo-text-secondary";
}

function CreditTransactionRow({ item }: { item: CreditTransactionItem }) {
  const normalizedType = item.type.toUpperCase();
  const typeLabel = transactionTypeLabels[normalizedType] ?? normalizedType;
  const reasonLabel = transactionReasonLabels[item.reason] ?? item.reason;

  return (
    <li className="py-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-base font-semibold tracking-[-0.02em] text-ufo-text">{reasonLabel}</p>
          <p className="mt-1 text-sm text-ufo-text-secondary">{typeLabel}</p>
          <p className="mt-2 text-xs text-ufo-text-dim">{formatDateTime(item.createdAt)}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className={`text-base font-bold ${getAmountClassName(item)}`}>
            {formatAmount(item)}
          </p>
          <p className="mt-2 text-xs text-ufo-text-secondary">
            잔액 {item.balanceAfter}
          </p>
        </div>
      </div>
    </li>
  );
}

export default function CreditHistoryScreen({
  initialPage,
  initialType,
  initialReason,
}: CreditHistoryScreenProps) {
  const router = useRouter();
  const { showAuthRequiredToast, toastMessage } = useAuthRequiredToast();
  const meQuery = useMeQuery();
  const transactionsQuery = useQuery(
    creditTransactionsQueryOptions(
      {
        page: initialPage,
        type: initialType,
        reason: initialReason,
      },
      { enabled: Boolean(meQuery.data) },
    ),
  );

  useEffect(() => {
    if (!meQuery.isPending && !meQuery.isError && !meQuery.data) {
      showAuthRequiredToast();
    }
  }, [meQuery.data, meQuery.isError, meQuery.isPending, showAuthRequiredToast]);

  useEffect(() => {
    if (isApiError(transactionsQuery.error, 401)) {
      showAuthRequiredToast();
    }
  }, [showAuthRequiredToast, transactionsQuery.error]);

  const buildRoute = useCallback(
    ({
      page,
      type,
      reason,
    }: {
      page: number;
      type: CreditTransactionTypeFilter;
      reason: CreditTransactionReasonFilter;
    }) => {
      const params = new URLSearchParams();

      if (page > 1) {
        params.set("page", String(page));
      }

      if (type !== "all") {
        params.set("type", type);
      }

      if (reason !== "all") {
        params.set("reason", reason);
      }

      const queryString = params.toString();

      return queryString ? `/my/credits?${queryString}` : "/my/credits";
    },
    [],
  );

  const handleTypeChange = useCallback(
    (type: CreditTransactionTypeFilter) => {
      router.push(buildRoute({ page: 1, type, reason: initialReason }));
    },
    [buildRoute, initialReason, router],
  );

  const handleReasonChange = useCallback(
    (reason: CreditTransactionReasonFilter) => {
      router.push(buildRoute({ page: 1, type: initialType, reason }));
    },
    [buildRoute, initialType, router],
  );

  const handlePageChange = useCallback(
    (page: number) => {
      router.push(buildRoute({ page, type: initialType, reason: initialReason }));
    },
    [buildRoute, initialReason, initialType, router],
  );

  const handleRetry = useCallback(() => {
    void meQuery.refetch();
    void transactionsQuery.refetch();
  }, [meQuery, transactionsQuery]);

  const isLoading = meQuery.isPending || (Boolean(meQuery.data) && transactionsQuery.isPending);
  const isError =
    meQuery.isError || (transactionsQuery.isError && !isApiError(transactionsQuery.error, 401));
  const transactions = transactionsQuery.data?.items ?? [];
  const currentPage = transactionsQuery.data?.page ?? initialPage;
  const nextPage = transactionsQuery.data?.nextPage ?? 0;

  return (
    <>
      <MobileShell surfaceClassName="pb-8">
        <TopBar
          left="back"
          title="크레딧 사용 기록"
          right={[{ type: "home", href: "/", ariaLabel: "홈으로 이동" }]}
          showBottomBorder
        />

        <section className="px-5 pb-4 pt-7">
          <h1 className="text-xl font-bold tracking-tight text-ufo-text">크레딧 사용 기록</h1>
          <p className="mt-3 text-sm leading-6 text-ufo-text-secondary">
            크레딧 획득과 사용 내역을 필터로 나누어 확인할 수 있어요.
          </p>
        </section>

        <section className="space-y-6 border-y border-ufo-border-light px-5 py-5">
          <FilterChipGroup
            label="분류"
            options={typeFilterOptions}
            value={initialType}
            onChange={handleTypeChange}
          />
          <FilterChipGroup
            label="사유"
            options={reasonFilterOptions}
            value={initialReason}
            onChange={handleReasonChange}
          />
        </section>

        {isLoading ? (
          <StateBlock
            type="loading"
            title="크레딧 기록을 불러오고 있어요."
            className="px-4 py-12"
          />
        ) : null}

        {isError ? (
          <StateBlock
            type="error"
            title="크레딧 기록을 불러오지 못했어요."
            description="잠시 후 다시 시도하거나 새로고침해 주세요."
            actionLabel="다시 시도"
            onAction={handleRetry}
            className="px-4 py-12"
          />
        ) : null}

        {!isLoading && !isError && transactions.length === 0 ? (
          <StateBlock
            type="empty"
            title="크레딧 기록이 없습니다."
            description="조건에 맞는 획득 또는 사용 기록이 아직 없어요."
            className="px-4 py-12"
          />
        ) : null}

        {!isLoading && !isError && transactions.length > 0 ? (
          <>
            <section className="px-5">
              <ul className="divide-y divide-ufo-border-light">
                {transactions.map((item) => (
                  <CreditTransactionRow key={item.id} item={item} />
                ))}
              </ul>
            </section>

            <Pagination
              currentPage={currentPage}
              nextPage={nextPage}
              onPageChange={handlePageChange}
            />
          </>
        ) : null}
      </MobileShell>
      <ToastMessage message={toastMessage} />
    </>
  );
}
