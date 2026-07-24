import Link from "next/link";
import ChatIcon from "@/components/icons/ChatIcon";
import CommentIcon from "@/components/icons/CommentIcon";
import type { AdminRoutePaths } from "@/features/admin/types/adminRoutePaths";

export default function AdminMainScreen({ routes }: { routes: AdminRoutePaths }) {
  const managementItems = [
    {
      title: "채팅 관리",
      description: "채팅방 목록과 메시지 내역을 확인합니다.",
      href: routes.chat,
      icon: "chat",
    },
    {
      title: "대체실 댓글 관리",
      description: "도안 대체실에 등록된 댓글을 확인합니다.",
      href: routes.comment,
      icon: "comment",
    },
  ] as const;

  return (
    <div className="px-4 py-5">
      <div className="mb-5">
        <p className="text-sm font-semibold text-ufo-brand">서비스 운영</p>
        <h2 className="mt-1 text-xl font-bold tracking-tight text-ufo-text">관리자 메인</h2>
        <p className="mt-2 text-sm text-ufo-text-subtle">관리할 항목을 선택해 주세요.</p>
      </div>

      <section aria-label="관리 메뉴">
        <ul className="space-y-3">
          {managementItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="flex min-h-24 items-center gap-4 rounded-2xl border border-ufo-divider bg-ufo-surface px-5 py-4"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-ufo-brand-pale text-ufo-brand">
                  {item.icon === "chat" ? (
                    <ChatIcon className="h-6 w-6" />
                  ) : (
                    <CommentIcon className="h-6 w-6" />
                  )}
                </span>
                <span className="min-w-0">
                  <strong className="block text-base font-bold text-ufo-text">{item.title}</strong>
                  <span className="mt-1 block text-sm leading-5 text-ufo-text-subtle">
                    {item.description}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
