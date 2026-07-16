export type MyHelpPageSlug =
  | "faq"
  | "notices"
  | "credits"
  | "inquiry"
  | "terms"
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
  faq: {
    slug: "faq",
    title: "FAQ",
    href: "/my/help/faq",
    emptyTitle: "FAQ 내용을 준비하고 있어요.",
    emptyDescription: "자주 묻는 질문을 이곳에서 확인할 수 있도록 준비 중입니다.",
  },
  notices: {
    slug: "notices",
    title: "공지사항",
    href: "/my/help/notices",
    emptyTitle: "공지사항을 준비하고 있어요.",
    emptyDescription: "서비스 소식과 안내를 이곳에서 확인할 수 있도록 준비 중입니다.",
  },
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
  terms: {
    slug: "terms",
    title: "서비스 이용약관",
    href: "/my/help/terms",
    emptyTitle: "서비스 이용약관을 준비하고 있어요.",
    emptyDescription: "서비스 이용 기준을 이곳에서 확인할 수 있도록 준비 중입니다.",
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
  myHelpPageBySlug.faq,
  myHelpPageBySlug.notices,
  myHelpPageBySlug.credits,
  myHelpPageBySlug.inquiry,
  myHelpPageBySlug.terms,
  myHelpPageBySlug.withdrawal,
] satisfies MyHelpPageConfig[];

export const myHelpMenuItems = [
  myHelpPages[0],
  myHelpPages[1],
  myHelpPages[2],
  myHelpPages[3],
  {
    title: "개인정보 처리방침",
    href: "https://www.notion.so/39d743c92c6d802c9387ebd14dc96c8e?source=copy_link",
    external: true,
  },
  myHelpPages[4],
  myHelpPages[5],
] satisfies MyHelpMenuItemConfig[];
