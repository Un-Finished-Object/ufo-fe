"use client";

import type { ReactNode } from "react";

type YesOrNoProps = {
  mainText: string;
  subText: ReactNode;
  yesLabel?: string;
  noLabel?: string;
  yesDisabled?: boolean;
  noDisabled?: boolean;
  onYes: () => void;
  onNo: () => void;
};

export default function YesOrNo({
  mainText,
  subText,
  yesLabel = "예",
  noLabel = "아니오",
  yesDisabled = false,
  noDisabled = false,
  onYes,
  onNo,
}: YesOrNoProps) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/20 px-4"
      role="dialog"
      aria-modal="true"
      aria-label={mainText}
    >
      <div className="w-full max-w-[336px] overflow-hidden rounded-2xl bg-ufo-surface shadow-lg">
        <div className="border-b border-ufo-border-light px-6 pb-5 pt-6 text-center">
          <h3 className="text-[15px] font-medium text-ufo-text-secondary">{mainText}</h3>
          <div className="mt-2 text-[11px] leading-4 text-ufo-text-muted">{subText}</div>
        </div>

        <div className="grid grid-cols-2 divide-x divide-ufo-border-light">
          <button
            type="button"
            onClick={onYes}
            disabled={yesDisabled}
            className="h-14 text-[16px] font-medium text-ufo-text-secondary disabled:cursor-not-allowed disabled:opacity-60"
          >
            {yesLabel}
          </button>
          <button
            type="button"
            onClick={onNo}
            disabled={noDisabled}
            className="h-14 text-[16px] font-medium text-ufo-text-secondary disabled:cursor-not-allowed disabled:opacity-60"
          >
            {noLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
