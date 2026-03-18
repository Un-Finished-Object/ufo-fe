type StarCircleIconProps = {
  starClassName?: string;
  circleClassName?: string;
  className?: string;
};

export default function StarCircleIcon({
  starClassName = "text-ufo-surface",
  circleClassName = "text-ufo-credit",
  className = "h-4 w-4",
}: StarCircleIconProps) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className}>
      <circle cx="12" cy="12" r="11" className={circleClassName} fill="currentColor" />
      <path
        d="M12,4.5 L13.76,9.57 L19.13,9.68 L14.85,12.93 L16.41,18.07 L12,15 L7.59,18.07 L9.15,12.93 L4.87,9.68 L10.24,9.57 Z"
        className={starClassName}
        fill="currentColor"
      />
    </svg>
  );
}
