"use client";

import { useEffect, useId, useRef, type KeyboardEvent, type ReactNode } from "react";

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
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const noButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const previouslyFocusedElement = document.activeElement as HTMLElement | null;

    noButtonRef.current?.focus();

    return () => {
      previouslyFocusedElement?.focus();
    };
  }, []);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape" && !noDisabled) {
      event.preventDefault();
      onNo();
      return;
    }

    if (event.key !== "Tab") {
      return;
    }

    const focusableElements = Array.from(
      dialogRef.current?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)") ?? [],
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements.at(-1);

    if (!firstElement || !lastElement) {
      event.preventDefault();
      return;
    }

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/20 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onKeyDown={handleKeyDown}
    >
      <div ref={dialogRef} className="w-full max-w-[336px] overflow-hidden rounded-2xl bg-ufo-surface shadow-lg">
        <div className="border-b border-ufo-border-light px-6 pb-5 pt-6 text-center">
          <h3 id={titleId} className="text-[15px] font-medium text-ufo-text-secondary">{mainText}</h3>
          <div id={descriptionId} className="mt-2 text-[11px] leading-4 text-ufo-text-muted">{subText}</div>
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
            ref={noButtonRef}
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
