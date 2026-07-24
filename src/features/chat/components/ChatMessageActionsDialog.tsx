"use client";

import { useEffect, useId, useRef, type KeyboardEvent } from "react";

type ChatMessageAction = {
  label: string;
  onSelect: () => void;
};

type ChatMessageActionsDialogProps = {
  actions: ChatMessageAction[];
  onClose: () => void;
};

export default function ChatMessageActionsDialog({
  actions,
  onClose,
}: ChatMessageActionsDialogProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const firstActionRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const previouslyFocusedElement = document.activeElement as HTMLElement | null;

    firstActionRef.current?.focus();

    return () => {
      previouslyFocusedElement?.focus();
    };
  }, []);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }

    if (event.key !== "Tab") {
      return;
    }

    const focusableElements = Array.from(
      dialogRef.current?.querySelectorAll<HTMLButtonElement>("button") ?? [],
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
      onKeyDown={handleKeyDown}
    >
      <div
        ref={dialogRef}
        className="w-full max-w-[336px] overflow-hidden rounded-2xl bg-ufo-surface shadow-lg"
      >
        <h3
          id={titleId}
          className="border-b border-ufo-border-light px-6 py-5 text-center text-[15px] font-medium text-ufo-text-secondary"
        >
          메시지 설정
        </h3>

        <div className="divide-y divide-ufo-border-light">
          {actions.map((action, index) => (
            <button
              key={action.label}
              ref={index === 0 ? firstActionRef : undefined}
              type="button"
              onClick={action.onSelect}
              className="block h-14 w-full text-[16px] font-medium text-ufo-text-secondary"
            >
              {action.label}
            </button>
          ))}
          <button
            type="button"
            onClick={onClose}
            className="block h-14 w-full text-[16px] font-medium text-ufo-text-muted"
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
}
