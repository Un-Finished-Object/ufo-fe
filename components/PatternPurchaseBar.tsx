"use client";

import CreditBadge from "@/components/CreditBadge";
import HeartIcon from "@/components/icons/HeartIcon";

type PatternPurchaseBarProps = {
  credits: number;
};

export default function PatternPurchaseBar({ credits }: PatternPurchaseBarProps) {
  return (
    <div className="sticky bottom-0 z-50 mx-auto w-full max-w-[430px] border-t border-ufo-brand bg-ufo-surface">
      <div className="flex w-full items-stretch">
        <button
          type="button"
          className="flex h-16 w-30 items-center justify-center border-r border-ufo-brand bg-ufo-brand"
          aria-label="찜하기"
        >
          <HeartIcon variant="outline" className="h-8 w-8 stroke-[#ffffff]" />
        </button>
        <button
          type="button"
          className="flex h-16 flex-1 items-center justify-center gap-2 bg-ufo-surface text-2xl leading-none font-semibold text-ufo-brand"
        >
          구매하기
          <CreditBadge
            credits={credits}
            badgeColor="#ffffff"
            circleColor="#49eaff"
            starColor="#ffffff"
            textColor="#49eaff"
          />
        </button>
      </div>
    </div>
  );
}
