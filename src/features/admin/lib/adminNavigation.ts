export type AdminNavigationItem = {
  label: string;
  href: string;
  description: string;
  icon: "chat" | "comment";
};

export const adminNavigationItems: AdminNavigationItem[] = [
  {
    label: "채팅 관리",
    href: "/admin/chats",
    description: "채팅방과 메시지 내역 확인",
    icon: "chat",
  },
  {
    label: "대체실 댓글 관리",
    href: "/admin/comments",
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
