type OnboardingProgressProps = {
  currentStep: number;
  totalSteps: number;
};

export default function OnboardingProgress({
  currentStep,
  totalSteps,
}: OnboardingProgressProps) {
  return (
    <div
      className="flex items-center justify-center gap-2"
      role="status"
      aria-label={`${totalSteps}단계 중 ${currentStep + 1}단계`}
    >
      {Array.from({ length: totalSteps }, (_, index) => (
        <span
          key={index}
          aria-hidden="true"
          className={`h-2 rounded-full transition-all duration-300 ${
            index === currentStep ? "w-6 bg-ufo-brand" : "w-2 bg-white/50"
          }`}
        />
      ))}
    </div>
  );
}
