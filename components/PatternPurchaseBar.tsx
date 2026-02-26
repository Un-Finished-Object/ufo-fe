"use client";

import HeartIcon from "@/components/icons/HeartIcon";

type PatternPurchaseBarProps = {
  credits: number;
};

function CreditBadge({ credits }: { credits: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#59cbe5]">
      <span className="inline-block h-3 w-3 rounded-full bg-[#59cbe5]" />
      {credits} 크레딧
    </span>
  );
}

export default function PatternPurchaseBar({ credits }: PatternPurchaseBarProps) {
  return (
    <div className="sticky bottom-0 z-50 mx-auto w-full max-w-[430px] border-t border-[#ffaba6] bg-[#ffffff]">
      <div className="flex w-full items-stretch">
        <button
          type="button"
          className="flex h-16 w-30 items-center justify-center border-r border-[#ffaba6] bg-[#ffaba6]"
          aria-label="찜하기"
        >
          <HeartIcon variant="outline" className="h-8 w-8 stroke-[#ffffff]" />
        </button>
        <button
          type="button"
          className="flex h-16 flex-1 items-center justify-center gap-2 bg-[#ffffff] text-2xl leading-none font-semibold text-[#ffaba6]"
        >
          구매하기
          <CreditBadge credits={credits} />
        </button>
      </div>
    </div>
  );
}
