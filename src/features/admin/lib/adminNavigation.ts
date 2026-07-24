import { adminRoutes } from "@/features/admin/lib/adminRoutes";

export type AdminNavigationItem = {
  label: string;
  href: string;
  description: string;
  icon: "home" | "chat" | "comment";
};

export const adminNavigationItems: AdminNavigationItem[] = [
  {
    label: "관리자 메인",
    href: adminRoutes.main,
    description: "관리 기능 모아보기",
    icon: "home",
  },
  {
    label: "채팅 관리",
    href: adminRoutes.chat,
    description: "채팅방과 메시지 내역 확인",
    icon: "chat",
  },
  {
    label: "대체실 댓글 관리",
    href: adminRoutes.comment,
    description: "도안 대체실 댓글 모니터링",
    icon: "comment",
  },
];

export function isAdminNavigationItemActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function getAdminPageTitle(pathname: string) {
  return (
    adminNavigationItems.find((item) =>
      isAdminNavigationItemActive(pathname, item.href),
    )?.label ?? "관리자 페이지"
  );
}
