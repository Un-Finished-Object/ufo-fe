"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import Footer from "@/components/Footer";
import TopBar from "@/components/TopBar";

type Provider = "google" | "kakao" | "naver";

const errorMessages: Record<string, string> = {
  oauth_failed: "소셜 로그인에 실패했습니다. 다시 시도해 주세요.",
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
    className: "bg-[#ffffff] text-[#000000] border",
    logoSrc: "/login/google_logo.svg",
  },
  {
    provider: "kakao",
    label: "카카오로 로그인",
    className: "bg-[#fee500] text-[#000000]",
    logoSrc: "/login/kakao_logo.svg",
  },
  {
    provider: "naver",
    label: "네이버로 로그인",
    className: "bg-[#03a94d] text-white",
    logoSrc: "/login/naver_logo.svg",
  },
];

export default function LoginPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const errorMessage = error ? errorMessages[error] : null;

  const handleSocialLogin = (provider: Provider) => {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE;

    if (!apiBase) {
      // eslint-disable-next-line react-hooks/immutability
      window.location.href = "/login?error=network";
      return;
    }

    const redirectUri = `${window.location.origin}/auth/complete`;
    const oauthStartUrl = `${apiBase}/auth/oauth/${provider}/start?redirect_uri=${encodeURIComponent(redirectUri)}`;

    // eslint-disable-next-line react-hooks/immutability
    window.location.href = oauthStartUrl;
  };

  return (
    <div className="min-h-screen bg-[#ececec]">
      <main className="mx-auto min-h-screen w-full max-w-[430px] bg-[#ffffff] pb-10 text-[#1f1f1f]">
        <TopBar
          left="back"
          showBottomBorder
          title="로그인"
          right={[
            { type: "home", href: "/", ariaLabel: "홈" },
          ]}
        />
        <section className="mx-auto w-full max-w-[430px] bg-[#ffffff] p-6 text-[#1f1f1f]">
          <div className="mb-10">
            <h1 className="mt-6 text-3xl text-[#ffa8a8] text-center tracking-tight"><b>UFO</b>에 <br/> 오신 걸 환영합니다!</h1>
          </div>

          <div className="bg-white/75 p-4 border-t border-[#dddddd] shadow-[0_1px_0_rgba(0,0,0,0.04)]">
            <p className="mb-5 text-sm text-[#6e6e6e] text-center">
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
            <p className="mt-4 rounded-xl bg-[#fdecee] px-3 py-2 text-center text-sm text-[#d04949]">
              {errorMessage}
            </p>
          ) : null}
        </section>
        <Footer />
      </main>
    </div>
  );
}
