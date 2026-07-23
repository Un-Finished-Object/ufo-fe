"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import Footer from "@/components/common/Footer";
import MobileShell from "@/components/layout/MobileShell";
import TopBar from "@/components/navigation/TopBar";
import ToastMessage from "@/components/common/ToastMessage";
import { useMeQuery } from "@/features/auth/hooks/useMeQuery";
import { buildApiUrl } from "@/lib/api/client";
import { markOAuthFlowStarted } from "@/features/auth/lib/oauthFlowSession";
import { AUTH_REQUIRED_MESSAGE } from "@/hooks/useAuthRequiredToast";
import { useToast } from "@/hooks/useToast";

type Provider = "google" | "kakao" | "naver";

const errorMessages: Record<string, string> = {
  oauth_failed: "소셜 로그인에 실패했습니다. 다시 시도해 주세요.",
  oauth_invalid_entry: "소셜 로그인을 먼저 진행해 주세요.",
  unauthorized: "사용자 인증에 실패했습니다. 다시 로그인해 주세요.",
  network: "네트워크 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
};

const socialButtons: Array<{
  provider: Provider;
  label: string;
  className: string;
  logoSrc: string;
}> = [
  {
    provider: "google",
    label: "Google로 로그인",
    className: "border bg-ufo-surface text-black",
    logoSrc: "/login/google_logo.svg",
  },
  {
    provider: "kakao",
    label: "카카오로 로그인",
    className: "bg-ufo-kakao text-black",
    logoSrc: "/login/kakao_logo.svg",
  },
  {
    provider: "naver",
    label: "네이버로 로그인",
    className: "bg-ufo-naver text-white",
    logoSrc: "/login/naver_logo.svg",
  },
];

function LoginPageContent() {
  const router = useRouter();
  const meQuery = useMeQuery();
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const errorMessage = error ? errorMessages[error] : null;

  const { toastMessage } = useToast({
    initialMessage:
      searchParams.get("toast") === "auth_required"
        ? AUTH_REQUIRED_MESSAGE
        : null,
  });

  useEffect(() => {
    if (meQuery.data) {
      router.replace("/");
    }
  }, [meQuery.data, router]);

  const handleSocialLogin = (provider: Provider) => {
    markOAuthFlowStarted();
    const redirectUri = `${window.location.origin}/auth/complete`;
    const oauthStartUrl = buildApiUrl(
      `/v1/auth/login/${provider}/authorize?redirect_uri=${encodeURIComponent(redirectUri)}`,
    );

    // eslint-disable-next-line react-hooks/immutability
    window.location.href = oauthStartUrl;
  };

  if (meQuery.data) {
    return null;
  }

  return (
    <>
      <ToastMessage message={toastMessage} />
      <MobileShell surfaceClassName="pb-10">
        <TopBar
          left="back"
          onLeftClick={() => router.back()}
          showBottomBorder
          title="로그인"
          right={[
            { type: "home", href: "/", ariaLabel: "홈" },
          ]}
        />
        <section className="p-6">
          <div className="mb-10">
            <h1 className="mt-6 text-3xl text-ufo-border text-center tracking-tight"><b>UFO</b>에 <br/> 오신 걸 환영합니다!</h1>
          </div>

          <div className="bg-white/75 p-4 border-t border-ufo-border-light shadow-[0_1px_0_rgba(0,0,0,0.04)]">
            <p className="mb-5 text-center text-sm text-ufo-text-secondary">
              소셜 아이디로 뜨친 만들기
            </p>
            <div className="flex flex-col gap-3">
              {socialButtons.map((button) => (
                <button
                  key={button.provider}
                  type="button"
                  onClick={() => handleSocialLogin(button.provider)}
                  aria-label={button.label}
                  className={`relative h-12 w-full rounded-[12px] text-sm font-semibold ${button.className}`}
                >
                  <span
                    aria-hidden
                    className="absolute left-4 top-1/2 block aspect-square -translate-y-1/2"
                    style={{ height: "max(16px, calc(100% / 3))" }}
                  >
                    <Image
                      src={button.logoSrc}
                      alt=""
                      fill
                      className="object-contain"
                    />
                  </span>
                  <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                    {button.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {errorMessage ? (
            <p className="mt-4 rounded-xl bg-ufo-brand-pale px-3 py-2 text-center text-sm text-ufo-error">
              {errorMessage}
            </p>
          ) : null}
        </section>
        <Footer />
      </MobileShell>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  );
}
