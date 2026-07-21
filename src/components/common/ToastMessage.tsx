"use client";

type ToastMessageProps = {
  message: string | null;
  position?: "top" | "bottom";
};

export default function ToastMessage({ message, position = "bottom" }: ToastMessageProps) {
  if (!message) {
    return null;
  }

  return (
    <div
      className={`fixed left-1/2 z-[80] w-[calc(100%-64px)] max-w-[366px] -translate-x-1/2 rounded-2xl bg-black/90 px-5 py-3.5 text-center text-sm leading-5 font-medium text-white shadow-lg ring-1 ring-white/10 ${
        position === "top" ? "top-6" : "bottom-6"
      }`}
      role="status"
      aria-live="polite"
    >
      {message}
    </div>
  );
}
