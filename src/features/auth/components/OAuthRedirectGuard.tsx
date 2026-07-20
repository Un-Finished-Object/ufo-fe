"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import MobileShell from "@/components/layout/MobileShell";
import { consumeValidOAuthFlow } from "@/features/auth/lib/oauthFlowSession";

type OAuthRedirectGuardProps = {
  children: ReactNode;
};

export default function OAuthRedirectGuard({ children }: OAuthRedirectGuardProps) {
  const router = useRouter();
  const [isAllowed, setIsAllowed] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (consumeValidOAuthFlow()) {
        setIsAllowed(true);
        return;
      }

      router.replace("/login?error=oauth_invalid_entry");
    }, 0);

    return () => window.clearTimeout(timer);
  }, [router]);

  if (!isAllowed) {
    return (
      <MobileShell surfaceClassName="flex items-center justify-center">
        <div
          className="h-8 w-8 animate-spin rounded-full border-4 border-ufo-brand-soft border-t-ufo-brand"
          role="status"
          aria-label="OAuth 접근 확인 중"
        />
      </MobileShell>
    );
  }

  return children;
}
