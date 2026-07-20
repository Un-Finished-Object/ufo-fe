import type { SVGProps } from "react";

type InfoIconProps = SVGProps<SVGSVGElement>;

export default function InfoIcon(props: InfoIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
      {...props}
    >
      <circle cx="12" cy="12" r="9" />
      <path strokeLinecap="round" d="M12 10.75v5.5" />
      <circle cx="12" cy="7.75" r=".75" fill="currentColor" stroke="none" />
    </svg>
  );
}
