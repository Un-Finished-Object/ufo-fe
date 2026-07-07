import type { ReactNode } from "react";

type MobileShellProps = {
  children: ReactNode;
  className?: string;
  surfaceClassName?: string;
  fullHeight?: boolean;
  overflowHidden?: boolean;
};

function joinClasses(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function MobileShell({
  children,
  className,
  surfaceClassName,
  fullHeight = false,
  overflowHidden = false,
}: MobileShellProps) {
  return (
    <div className={joinClasses("min-h-screen bg-ufo-bg", className)}>
      <main
        className={joinClasses(
          "mx-auto w-full max-w-[430px] bg-ufo-surface text-ufo-text",
          fullHeight ? "flex h-screen min-h-screen flex-col" : "min-h-screen",
          overflowHidden && "overflow-hidden",
          surfaceClassName,
        )}
      >
        {children}
      </main>
    </div>
  );
}
