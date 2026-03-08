import StarCircleIcon from "@/components/icons/StarCircleIcon";

type CreditBadgeProps = {
  credits: number;
  badgeColor?: string;
  circleColor?: string;
  starColor?: string;
  textColor?: string;
};

export default function CreditBadge({
  credits,
  badgeColor = "var(--color-ufo-cyan)",
  circleColor = "var(--color-ufo-surface)",
  starColor = "var(--color-ufo-cyan)",
  textColor = "var(--color-ufo-surface)",
}: CreditBadgeProps) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold"
      style={{ backgroundColor: badgeColor, color: textColor }}
    >
      <StarCircleIcon circleColor={circleColor} starColor={starColor} className="h-3.5 w-3.5" />
      {credits} 크레딧
    </span>
  );
}
