"use client";

type PatternPurchaseBarProps = {
  credits: number;
};

function HeartIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-8 w-8 fill-none stroke-[#ffffff]"
      strokeWidth="2"
    >
      <path d="M12.1 20.7c-.1.1-.3.1-.4 0-5-4.5-8.2-7.4-8.2-11A4.9 4.9 0 0 1 8.4 4.8c1.5 0 2.9.7 3.8 1.8.9-1.1 2.3-1.8 3.8-1.8a4.9 4.9 0 0 1 4.9 4.9c0 3.6-3.2 6.5-8.2 11Z" />
    </svg>
  );
}

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
          <HeartIcon />
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
