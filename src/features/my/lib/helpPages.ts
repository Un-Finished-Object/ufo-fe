import { PRIVACY_POLICY_URL, TERMS_OF_SERVICE_URL } from "@/lib/legalLinks";

export type MyHelpPageSlug =
  | "credits"
  | "inquiry"
  | "withdrawal";

export type MyHelpPageConfig = {
  slug: MyHelpPageSlug;
  title: string;
  href: `/my/help/${MyHelpPageSlug}`;
  emptyTitle: string;
  emptyDescription: string;
};

export type MyHelpMenuItemConfig =
  | MyHelpPageConfig
  | {
      title: string;
      href: string;
      external: true;
    };

export const myHelpPageBySlug = {
  credits: {
    slug: "credits",
    title: "크레딧 가이드",
    href: "/my/help/credits",
    emptyTitle: "크레딧 가이드를 준비하고 있어요.",
    emptyDescription: "크레딧 획득과 사용 기준을 이곳에서 확인할 수 있도록 준비 중입니다.",
  },
  inquiry: {
    slug: "inquiry",
    title: "1:1 문의",
    href: "/my/help/inquiry",
    emptyTitle: "1:1 문의 화면을 준비하고 있어요.",
    emptyDescription: "문의 접수와 답변 확인 기능을 이곳에서 사용할 수 있도록 준비 중입니다.",
  },
  withdrawal: {
    slug: "withdrawal",
    title: "회원탈퇴",
    href: "/my/help/withdrawal",
    emptyTitle: "회원탈퇴 화면을 준비하고 있어요.",
    emptyDescription: "계정 탈퇴 절차와 안내를 이곳에서 확인할 수 있도록 준비 중입니다.",
  },
} satisfies Record<MyHelpPageSlug, MyHelpPageConfig>;

export const myHelpPages = [
  myHelpPageBySlug.credits,
  myHelpPageBySlug.inquiry,
  myHelpPageBySlug.withdrawal,
] satisfies MyHelpPageConfig[];

export const myHelpMenuItems = [
  myHelpPages[0],
  myHelpPages[1],
  {
    title: "개인정보 처리방침",
    href: PRIVACY_POLICY_URL,
    external: true,
  },
  {
    title: "서비스 이용약관",
    href: TERMS_OF_SERVICE_URL,
    external: true,
  },
  myHelpPages[2],
] satisfies MyHelpMenuItemConfig[];
