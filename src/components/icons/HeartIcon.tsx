export type HeartIconVariant = "outline" | "filled";

type HeartIconProps = {
  variant?: HeartIconVariant;
  className?: string;
};

export default function HeartIcon({
  variant = "outline",
  className = "h-5 w-5",
}: HeartIconProps) {
  if (variant === "filled") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className={className}>
        <path d="M12.1 20.7c-.1.1-.3.1-.4 0-5-4.5-8.2-7.4-8.2-11A4.9 4.9 0 0 1 8.4 4.8c1.5 0 2.9.7 3.8 1.8.9-1.1 2.3-1.8 3.8-1.8a4.9 4.9 0 0 1 4.9 4.9c0 3.6-3.2 6.5-8.2 11Z" />
      </svg>
    );
  }

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={`${className} fill-none`}
      strokeWidth="2"
    >
      <path d="M12.1 20.7c-.1.1-.3.1-.4 0-5-4.5-8.2-7.4-8.2-11A4.9 4.9 0 0 1 8.4 4.8c1.5 0 2.9.7 3.8 1.8.9-1.1 2.3-1.8 3.8-1.8a4.9 4.9 0 0 1 4.9 4.9c0 3.6-3.2 6.5-8.2 11Z" />
    </svg>
  );
}
