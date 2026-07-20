"use client";

import { useQuery } from "@tanstack/react-query";
import StateBlock from "@/components/common/StateBlock";
import MobileShell from "@/components/layout/MobileShell";
import TopBar from "@/components/navigation/TopBar";
import {
  creditRulesQueryOptions,
  type CreditRuleItem,
} from "@/features/my/queries/creditRuleQueries";

function formatCreditAmount(amount: number) {
  const absoluteAmount = Math.abs(amount);

  return amount > 0 ? `+${absoluteAmount} 크레딧` : `-${absoluteAmount} 크레딧`;
}

function CreditRuleList({
  title,
  description,
  rules,
  amountClassName,
}: {
  title: string;
  description: string;
  rules: CreditRuleItem[];
  amountClassName: string;
}) {
  return (
    <section className="mt-8">
      <div>
        <h2 className="text-base font-semibold tracking-[-0.02em] text-ufo-text">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-ufo-text-secondary">{description}</p>
      </div>

      {rules.length > 0 ? (
        <ul className="mt-4 divide-y divide-ufo-border-light border-y border-ufo-border-light">
          {rules.map((rule) => (
            <li key={rule.key} className="py-4">
              <div className="flex items-start justify-between gap-4">
                <p className="min-w-0 flex-1 text-sm leading-6 text-ufo-text-secondary">
                  {rule.description}
                </p>
                <p className={`shrink-0 text-sm font-semibold ${amountClassName}`}>
                  {formatCreditAmount(rule.amount)}
                </p>
              </div>
              {rule.dailyLimitExempt ? (
                <p className="mt-2 text-xs text-ufo-text-dim">일일 획득 한도에 포함되지 않아요.</p>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <StateBlock
          type="empty"
          title="표시할 정책이 없습니다."
          variant="plain"
          className="mt-2"
        />
      )}
    </section>
  );
}

export default function CreditGuideScreen() {
  const creditRulesQuery = useQuery(creditRulesQueryOptions());

  return (
    <MobileShell surfaceClassName="pb-8">
      <TopBar
        left="back"
        title="크레딧 가이드"
        right={[{ type: "home", href: "/", ariaLabel: "홈으로 이동" }]}
        showBottomBorder
      />

      {creditRulesQuery.isPending ? (
        <StateBlock
          type="loading"
          title="크레딧 정책을 불러오고 있어요."
          className="px-4 py-12"
        />
      ) : null}

      {creditRulesQuery.isError ? (
        <StateBlock
          type="error"
          title="크레딧 정책을 불러오지 못했어요."
          description="잠시 후 다시 시도하거나 새로고침해 주세요."
          actionLabel="다시 시도"
          onAction={() => {
            void creditRulesQuery.refetch();
          }}
          className="px-4 py-12"
        />
      ) : null}

      {creditRulesQuery.data ? (
        <section className="px-5 pb-10 pt-7">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-ufo-text">크레딧 사용 안내</h1>
            <p className="mt-3 text-sm leading-6 text-ufo-text-secondary">
              크레딧은 UFO에서 활동하거나 일부 기능을 이용할 때 획득하고 사용할 수 있어요.
            </p>
            <p className="mt-4 inline-flex min-h-10 items-center rounded-xl bg-ufo-brand-pale px-4 py-2 text-sm font-semibold text-ufo-brand">
              하루 최대 {creditRulesQuery.data.dailyMaxEarnCredits} 크레딧까지 획득
            </p>
          </div>

          <CreditRuleList
            title="획득"
            description="서비스 활동을 통해 받을 수 있는 크레딧 정책입니다."
            rules={creditRulesQuery.data.earnRules}
            amountClassName="text-ufo-brand"
          />

          <CreditRuleList
            title="소비"
            description="크레딧을 사용하는 기능과 차감 기준입니다."
            rules={creditRulesQuery.data.spendRules}
            amountClassName="text-ufo-text"
          />
        </section>
      ) : null}
    </MobileShell>
  );
}
