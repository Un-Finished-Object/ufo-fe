import StateBlock from "@/components/common/StateBlock";
import MobileShell from "@/components/layout/MobileShell";
import TopBar from "@/components/navigation/TopBar";
import type { MyHelpPageConfig } from "@/features/my/lib/helpPages";

type MyHelpDetailScreenProps = {
  page: MyHelpPageConfig;
};

const inquiryContact = {
  email: "ufoknitting@gmail.com",
  instagramHandle: "@ufoknitting",
  instagramUrl: "https://www.instagram.com/ufoknitting",
} as const;

function InquiryHelpContent() {
  return (
    <section className="px-5 pb-10 pt-7">
      <div>
        <h1 className="text-xl font-bold tracking-[-0.02em] text-ufo-text">무엇을 도와드릴까요?</h1>
        <p className="mt-3 text-sm leading-6 text-ufo-text-secondary">
          궁금한 점이나 문제가 있다면 아래 채널로 문의해 주세요. 문의 내용을 자세히
          남겨주시면 더 빠르게 도와드릴 수 있어요.
        </p>
      </div>

      <div className="mt-8 space-y-7">
        <section>
          <h2 className="text-base font-semibold tracking-[-0.02em] text-ufo-text">
            이메일 문의
          </h2>
          <p className="mt-2 text-sm leading-6 text-ufo-text-secondary">
            자세한 문의는 이메일로 보내주세요. 답변은 영업일 기준 2~3일 내 순차적으로
            도와드려요.
          </p>
          <a
            href={`mailto:${inquiryContact.email}`}
            className="mt-3 inline-flex min-h-10 items-center rounded-xl bg-ufo-brand-pale px-4 py-2 text-sm font-semibold text-ufo-brand"
          >
            {inquiryContact.email}
          </a>
        </section>

        <section>
          <h2 className="text-base font-semibold tracking-[-0.02em] text-ufo-text">
            인스타그램 문의
          </h2>
          <p className="mt-2 text-sm leading-6 text-ufo-text-secondary">
            빠른 소식과 간단한 문의는 인스타그램 DM으로도 확인할 수 있어요.
          </p>
          <a
            href={inquiryContact.instagramUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex min-h-10 items-center rounded-xl bg-ufo-brand-pale px-4 py-2 text-sm font-semibold text-ufo-brand"
          >
            {inquiryContact.instagramHandle}
          </a>
        </section>
      </div>

      <section className="mt-9 border-t border-ufo-border-light pt-6">
        <h2 className="text-base font-semibold tracking-[-0.02em] text-ufo-text">
          문의 시 함께 알려주세요
        </h2>
        <ul className="mt-4 space-y-2 text-sm leading-6 text-ufo-text-secondary">
          <li>닉네임</li>
          <li>가입 이메일</li>
          <li>문제가 발생한 화면</li>
          <li>오류 화면 캡처</li>
        </ul>
      </section>
    </section>
  );
}

export default function MyHelpDetailScreen({ page }: MyHelpDetailScreenProps) {
  return (
    <MobileShell surfaceClassName="pb-8">
      <TopBar
        left="back"
        title={page.title}
        right={[{ type: "home", href: "/", ariaLabel: "홈으로 이동" }]}
        showBottomBorder
      />

      {page.slug === "inquiry" ? (
        <InquiryHelpContent />
      ) : (
        <StateBlock
          type="empty"
          title={page.emptyTitle}
          description={page.emptyDescription}
          className="px-4 py-12"
        />
      )}
    </MobileShell>
  );
}
