"use client";

import { useSearchParams } from "next/navigation";
import NavBar from "@/components/NavBar";

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
}> = [
  {
    provider: "google",
    label: "Google로 계속하기",
    className: "bg-white text-[#222] border border-[#d9d9d9]",
  },
  {
    provider: "kakao",
    label: "Kakao로 계속하기",
    className: "bg-[#FEE500] text-[#191919]",
  },
  {
    provider: "naver",
    label: "Naver로 계속하기",
    className: "bg-[#03C75A] text-white",
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
    <main className="min-h-screen bg-[#ececec] px-4 pb-10">
      <NavBar />
      <section className="mx-auto w-full max-w-[430px] rounded-[28px] bg-[#ffffff] p-6 text-[#1f1f1f]">
        <div className="mb-10">
          <h1 className="mt-6 text-2xl font-black tracking-tight">로그인</h1>
          <p className="mt-2 text-sm text-[#7b7b7b]">
            소셜 계정으로 간편하게 시작해 보세요.
          </p>
        </div>

        <div className="rounded-2xl bg-white/75 p-4 shadow-[0_1px_0_rgba(0,0,0,0.04)]">
          <div className="flex flex-col gap-3">
            {socialButtons.map((button) => (
              <button
                key={button.provider}
                type="button"
                onClick={() => handleSocialLogin(button.provider)}
                className={`h-12 w-full rounded-xl text-sm font-semibold ${button.className}`}
              >
                {button.label}
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
    </main>
  );
}
