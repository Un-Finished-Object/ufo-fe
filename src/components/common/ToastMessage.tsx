"use client";

type ToastMessageProps = {
  message: string | null;
};

export default function ToastMessage({ message }: ToastMessageProps) {
  if (!message) {
    return null;
  }

  return (
    <div
      className="fixed bottom-6 left-1/2 z-[80] w-[calc(100%-24px)] max-w-[430px] -translate-x-1/2 rounded-2xl bg-black/90 px-5 py-3.5 text-center text-sm leading-5 font-medium text-white shadow-lg ring-1 ring-white/10"
      role="status"
      aria-live="polite"
    >
      {message}
    </div>
  );
}
