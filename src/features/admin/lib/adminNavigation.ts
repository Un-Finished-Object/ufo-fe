import type { AdminRoutePaths } from "@/features/admin/types/adminRoutePaths";

export type AdminNavigationItem = {
  label: string;
  href: string;
  description: string;
  icon: "home" | "chat" | "comment";
};

export function getAdminNavigationItems(routes: AdminRoutePaths): AdminNavigationItem[] {
  return [
    {
      label: "관리자 메인",
      href: routes.main,
      description: "관리 기능 모아보기",
      icon: "home",
    },
    {
      label: "채팅 관리",
      href: routes.chat,
      description: "채팅방과 메시지 내역 확인",
      icon: "chat",
    },
    {
      label: "대체실 댓글 관리",
      href: routes.comment,
      description: "도안 대체실 댓글 모니터링",
      icon: "comment",
    },
  ];
}

export function isAdminNavigationItemActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function getAdminPageTitle(pathname: string, routes: AdminRoutePaths) {
  return (
    getAdminNavigationItems(routes).find((item) =>
      isAdminNavigationItemActive(pathname, item.href),
    )?.label ?? "관리자 페이지"
  );
}
