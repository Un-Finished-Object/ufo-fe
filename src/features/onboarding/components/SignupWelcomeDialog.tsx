"use client";

import { useEffect, useRef, type CSSProperties, type KeyboardEvent } from "react";
import CreditBadge from "@/components/credits/CreditBadge";
import StarCircleIcon from "@/components/icons/StarCircleIcon";
import { SIGNUP_REWARD_CREDITS } from "@/features/onboarding/lib/signupWelcome";

const fireworkBursts = [
  { position: "left-[14%] top-[20%]", delay: "0s" },
  { position: "right-[12%] top-[16%]", delay: "0.35s" },
  { position: "left-[20%] bottom-[22%]", delay: "0.7s" },
  { position: "right-[18%] bottom-[18%]", delay: "1.05s" },
] as const;

const particleColors = ["bg-ufo-brand", "bg-ufo-credit", "bg-white"] as const;

type SignupWelcomeDialogProps = {
  onClose: () => void;
};

export default function SignupWelcomeDialog({ onClose }: SignupWelcomeDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const startButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previouslyFocusedElement = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    startButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      previouslyFocusedElement?.focus();
    };
  }, []);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }

    if (event.key === "Tab") {
      event.preventDefault();
      startButtonRef.current?.focus();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center overflow-hidden bg-black/65 px-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="signup-welcome-title"
      aria-describedby="signup-welcome-description"
      onKeyDown={handleKeyDown}
    >
      <div
        className="pointer-events-none absolute inset-y-0 left-1/2 w-full max-w-[430px] -translate-x-1/2 overflow-hidden"
        aria-hidden="true"
      >
        {fireworkBursts.map((burst, burstIndex) => (
          <span
            key={burst.position}
            className={`signup-firework-burst absolute ${burst.position}`}
            style={{ "--firework-delay": burst.delay } as CSSProperties}
          >
            {Array.from({ length: 10 }, (_, particleIndex) => (
              <span
                key={particleIndex}
                className={`signup-firework-particle ${particleColors[(burstIndex + particleIndex) % particleColors.length]}`}
                style={{
                  "--firework-angle": `${particleIndex * 36}deg`,
                } as CSSProperties}
              />
            ))}
          </span>
        ))}
      </div>

      <div
        ref={dialogRef}
        className="signup-welcome-card relative w-full max-w-[344px] overflow-hidden rounded-2xl border border-ufo-border-light bg-ufo-surface px-6 pb-6 pt-8 text-center shadow-lg"
      >
        <div className="absolute inset-x-0 top-0 h-1.5 bg-ufo-brand" aria-hidden="true" />
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-ufo-brand-pale shadow-inner" aria-hidden="true">
          <StarCircleIcon
            className="h-12 w-12"
            circleClassName="text-ufo-brand"
            starClassName="text-ufo-surface"
          />
        </div>
        <p className="mt-4 text-xs font-bold tracking-[0.2em] text-ufo-brand">WELCOME TO UFO</p>
        <h2 id="signup-welcome-title" className="mt-2 text-2xl font-black leading-8 tracking-tight text-ufo-text">
          UFO 회원이 되신 것을
          <span className="block">환영해요!</span>
        </h2>
        <p id="signup-welcome-description" className="mt-3 text-sm leading-6 text-ufo-text-secondary">
          가입 축하 선물로
          <span className="mx-1 font-bold text-ufo-text">{SIGNUP_REWARD_CREDITS} 크레딧</span>이
          지급되었어요.
        </p>
        <div className="mt-4 flex justify-center">
          <CreditBadge
            credits={SIGNUP_REWARD_CREDITS}
            className="bg-ufo-credit px-3 py-1.5 text-xs font-bold text-ufo-text"
            circleClassName="text-ufo-surface"
            starClassName="text-ufo-credit"
          />
        </div>
        <button
          ref={startButtonRef}
          type="button"
          onClick={onClose}
          className="mt-6 h-12 w-full rounded-xl bg-ufo-brand text-base font-bold text-white shadow-md transition-colors hover:bg-ufo-brand-soft hover:text-ufo-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ufo-brand"
        >
          가이드 시작하기
        </button>
      </div>
    </div>
  );
}
