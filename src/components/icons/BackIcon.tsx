import type { SVGProps } from "react";

type BackIconProps = SVGProps<SVGSVGElement>;

export default function BackIcon(props: BackIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 34 34"
      fill="currentColor"
      aria-hidden="true"
      {...props}
    >
      <path d="M11.0854 18.4166L19.0187 26.35L17 28.3333L5.66663 17L17 5.66663L19.0187 7.64996L11.0854 15.5833H28.3333V18.4166H11.0854Z" />
    </svg>
  );
}
