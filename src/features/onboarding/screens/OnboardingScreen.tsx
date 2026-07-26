"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type TouchEvent } from "react";
import MobileShell from "@/components/layout/MobileShell";
import OnboardingProgress from "@/features/onboarding/components/OnboardingProgress";
import OnboardingSlide from "@/features/onboarding/components/OnboardingSlide";
import SignupWelcomeDialog from "@/features/onboarding/components/SignupWelcomeDialog";
import { onboardingSlides } from "@/features/onboarding/lib/onboardingSlides";
import { SIGNUP_WELCOME_SESSION_KEY } from "@/features/onboarding/lib/signupWelcome";

const SWIPE_THRESHOLD_PX = 45;

export default function OnboardingScreen() {
  const router = useRouter();
  const touchStartXRef = useRef<number | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isSignupWelcomeOpen, setIsSignupWelcomeOpen] = useState(false);
  const isLastStep = currentStep === onboardingSlides.length - 1;
  const currentSlide = onboardingSlides[currentStep];

  const goToPreviousStep = useCallback(() => {
    setCurrentStep((step) => Math.max(0, step - 1));
  }, []);

  const goToNextStep = useCallback(() => {
    if (isLastStep) {
      router.replace("/");
      return;
    }

    setCurrentStep((step) => Math.min(onboardingSlides.length - 1, step + 1));
  }, [isLastStep, router]);

  const closeSignupWelcome = useCallback(() => {
    setIsSignupWelcomeOpen(false);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (window.sessionStorage.getItem(SIGNUP_WELCOME_SESSION_KEY) !== "true") {
        return;
      }

      window.sessionStorage.removeItem(SIGNUP_WELCOME_SESSION_KEY);
      setIsSignupWelcomeOpen(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isSignupWelcomeOpen) return;
      if (event.key === "ArrowLeft") goToPreviousStep();
      if (event.key === "ArrowRight") goToNextStep();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToNextStep, goToPreviousStep, isSignupWelcomeOpen]);

  const handleTouchStart = (event: TouchEvent<HTMLElement>) => {
    touchStartXRef.current = event.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (event: TouchEvent<HTMLElement>) => {
    const touchStartX = touchStartXRef.current;
    const touchEndX = event.changedTouches[0]?.clientX;
    touchStartXRef.current = null;

    if (touchStartX === null || touchEndX === undefined) return;

    const distance = touchEndX - touchStartX;
    if (distance > SWIPE_THRESHOLD_PX) goToPreviousStep();
    if (distance < -SWIPE_THRESHOLD_PX) goToNextStep();
  };

  return (
    <MobileShell fullHeight overflowHidden surfaceClassName="relative bg-ufo-text">
      <div className="absolute inset-0" aria-hidden="true">
        {onboardingSlides.map((slide, index) => (
          <Image
            key={slide.imageSrc}
            src={slide.imageSrc}
            alt=""
            fill
            priority={index === 0}
            sizes="(max-width: 430px) 100vw, 430px"
            className={`object-cover transition-opacity duration-500 motion-reduce:transition-none ${
              index === currentStep ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}
        <div className={`absolute inset-0 transition-colors duration-500 ${currentSlide.overlayClassName}`} />
        <div className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />
      </div>

      <div
        className="relative z-10 flex h-full min-h-0 flex-col px-6 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(2rem,env(safe-area-inset-top))]"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Image
              src="/ufo_pk.webp"
              alt="UFO"
              width={162}
              height={120}
              priority
              className="h-6 w-auto"
            />
            <span className="text-xs font-semibold tracking-[0.18em] text-white">GUIDE</span>
          </div>
          <span className="text-xs font-semibold text-white/70">
            {currentStep + 1} / {onboardingSlides.length}
          </span>
        </div>

        <div className="mt-6">
          <OnboardingSlide
            slide={currentSlide}
            step={currentStep}
            totalSteps={onboardingSlides.length}
          />
        </div>

        <div className="mt-auto">
          <div className="mt-8">
            <OnboardingProgress
              currentStep={currentStep}
              totalSteps={onboardingSlides.length}
            />
          </div>

          <div className="mt-6 flex items-center gap-3">
            {currentStep > 0 ? (
              <button
                type="button"
                onClick={goToPreviousStep}
                className="h-12 w-20 rounded-xl border border-white/35 bg-black/15 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/15"
              >
                이전
              </button>
            ) : null}
            <button
              type="button"
              onClick={goToNextStep}
              className="h-12 flex-1 rounded-xl bg-ufo-brand text-base font-semibold text-white shadow-lg transition-colors hover:bg-ufo-brand-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              {isLastStep ? "UFO 시작하기" : "다음"}
            </button>
          </div>
        </div>
      </div>
      {isSignupWelcomeOpen ? (
        <SignupWelcomeDialog onClose={closeSignupWelcome} />
      ) : null}
    </MobileShell>
  );
}
