import type { ReactNode } from "react";

type MobileShellProps = {
  children: ReactNode;
  className?: string;
  surfaceClassName?: string;
  fullHeight?: boolean;
  dynamicViewport?: boolean;
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
  dynamicViewport = false,
  overflowHidden = false,
}: MobileShellProps) {
  return (
    <div className={joinClasses(dynamicViewport ? "min-h-dvh bg-ufo-bg" : "min-h-screen bg-ufo-bg", className)}>
      <main
        className={joinClasses(
          "mx-auto w-full max-w-[430px] bg-ufo-surface text-ufo-text",
          fullHeight && dynamicViewport && "flex h-dvh min-h-dvh flex-col",
          fullHeight && !dynamicViewport && "flex h-screen min-h-screen flex-col",
          !fullHeight && dynamicViewport && "min-h-dvh",
          !fullHeight && !dynamicViewport && "min-h-screen",
          overflowHidden && "overflow-hidden",
          surfaceClassName,
        )}
      >
        {children}
      </main>
    </div>
  );
}
