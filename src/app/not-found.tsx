import Link from "next/link";
import MobileShell from "@/components/layout/MobileShell";

export default function NotFound() {
  return (
    <MobileShell
      dynamicViewport
      surfaceClassName="flex px-5 py-8"
    >
      <section
        aria-labelledby="not-found-title"
        className="flex flex-1 items-center justify-center"
      >
        <div className="w-full rounded-[32px] border border-ufo-border bg-white px-6 py-10 text-center">
          <span className="inline-flex rounded-full bg-ufo-brand-pale px-4 py-2 text-sm font-semibold text-ufo-text">
            404
          </span>

          <h1
            id="not-found-title"
            className="mt-6 text-2xl font-semibold tracking-[-0.03em] text-ufo-text"
          >
            페이지를 찾을 수 없어요
          </h1>

          <p className="mt-3 text-sm leading-6 text-ufo-text-secondary">
            주소가 잘못되었거나 삭제된 페이지일 수 있어요.
            <br />
            아래 메뉴에서 다시 시작해 주세요.
          </p>

          <div className="mt-8 grid grid-cols-2 gap-3">
            <Link
              href="/"
              className="inline-flex min-h-12 items-center justify-center rounded-xl bg-ufo-brand-soft px-4 py-3 text-sm font-semibold text-ufo-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ufo-text"
            >
              홈으로
            </Link>
            <Link
              href="/patterns"
              className="inline-flex min-h-12 items-center justify-center rounded-xl border border-ufo-border bg-white px-4 py-3 text-sm font-semibold text-ufo-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ufo-text"
            >
              도안 보기
            </Link>
          </div>
        </div>
      </section>
    </MobileShell>
  );
}
