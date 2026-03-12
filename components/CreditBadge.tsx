import StarCircleIcon from "@/components/icons/StarCircleIcon";

type CreditBadgeProps = {
  credits: number;
  className?: string;
  circleClassName?: string;
  starClassName?: string;
};

export default function CreditBadge({
  credits,
  className = "bg-ufo-credit text-ufo-surface",
  circleClassName = "text-ufo-surface",
  starClassName = "text-ufo-credit",
}: CreditBadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold ${className}`}>
      <StarCircleIcon
        circleClassName={circleClassName}
        starClassName={starClassName}
        className="h-3.5 w-3.5"
      />
      {credits} 크레딧
    </span>
  );
}
