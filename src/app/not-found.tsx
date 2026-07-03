import Link from "next/link";
import MobileShell from "@/components/layout/MobileShell";

export default function NotFound() {
  return (
    <MobileShell surfaceClassName="relative flex flex-col overflow-hidden px-5 pb-10 pt-8">
        <div
          aria-hidden="true"
          className="absolute left-1/2 top-20 h-44 w-44 -translate-x-1/2 rounded-full bg-ufo-brand-pale blur-3xl"
        />

        <section className="relative flex flex-1 flex-col justify-center">
          <div className="rounded-[34px] border border-ufo-border-light bg-gradient-to-b from-white via-ufo-brand-pale/60 to-white px-6 pb-8 pt-7 shadow-[0_18px_60px_rgba(31,31,31,0.08)]">
            <div className="mb-6 inline-flex w-fit items-center rounded-full border border-ufo-border bg-white px-3 py-1.5 text-[11px] font-semibold tracking-[0.18em] text-ufo-brand">
              ERROR 404
            </div>

            <p className="text-sm font-semibold text-ufo-text-secondary">Page not found</p>
            <h1 className="mt-2 text-[32px] font-semibold leading-[1.15] tracking-[-0.04em]">
              찾으시는 페이지가
              <br />
              우주 어딘가로 사라졌어요
            </h1>

            <p className="mt-5 text-sm leading-6 text-ufo-text-secondary">
              주소가 잘못 입력되었거나, 더 이상 제공되지 않는 페이지일 수 있습니다. 아래 버튼으로
              다시 이동해 주세요.
            </p>

            <div className="mt-8 rounded-[28px] bg-ufo-text px-5 py-5 text-white">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/65">
                Quick route
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <Link
                  href="/"
                  className="inline-flex items-center justify-center rounded-full bg-white px-4 py-3 text-sm font-semibold text-ufo-text"
                >
                  홈으로
                </Link>
                <Link
                  href="/patterns"
                  className="inline-flex items-center justify-center rounded-full border border-white/20 px-4 py-3 text-sm font-semibold text-white"
                >
                  도안 보기
                </Link>
              </div>
            </div>

            <div className="mt-6 rounded-[24px] bg-white/90 px-4 py-4 text-sm leading-6 text-ufo-text-secondary shadow-sm">
              <p className="font-semibold text-ufo-text">입력한 URL을 다시 확인해 주세요.</p>
              <p className="mt-1">UFO는 현재 모바일 화면 기준으로 동일한 UI를 제공합니다.</p>
            </div>
          </div>
        </section>
    </MobileShell>
  );
}
