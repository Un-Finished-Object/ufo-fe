import type { OnboardingSlide as OnboardingSlideData } from "@/features/onboarding/lib/onboardingSlides";

type OnboardingSlideProps = {
  slide: OnboardingSlideData;
  step: number;
  totalSteps: number;
};

export default function OnboardingSlide({
  slide,
  step,
  totalSteps,
}: OnboardingSlideProps) {
  return (
    <section
      className="text-left text-white"
      role="group"
      aria-roledescription="슬라이드"
      aria-label={`${totalSteps}개 중 ${step + 1}번째`}
    >
      <h1 className="whitespace-pre-line text-2xl font-bold leading-snug tracking-tight">
        {slide.title}
      </h1>
      {slide.description ? (
        <p className="mt-4 whitespace-pre-line text-sm leading-6 text-white/85">
          {slide.description}
        </p>
      ) : null}
    </section>
  );
}
