"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

function BackIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-6 w-6 fill-none stroke-[#5a5a5a]"
      strokeWidth="2.2"
    >
      <path d="M15 5 8 12l7 7" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="22"
      height="22"
      fill="currentColor"
      className="bi bi-chat-right-fill"
      viewBox="0 0 16 16"
    >
      <path d="M14 0a2 2 0 0 1 2 2v12.793a.5.5 0 0 1-.854.353l-2.853-2.853a1 1 0 0 0-.707-.293H2a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2z" />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="22"
      height="22"
      fill="currentColor"
      className="bi bi-person-circle"
      viewBox="0 0 16 16"
    >
      <path d="M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0" />
      <path
        fillRule="evenodd"
        d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8m8-7a7 7 0 0 0-5.468 11.37C3.242 11.226 4.805 10 8 10s4.757 1.225 5.468 2.37A7 7 0 0 0 8 1"
      />
    </svg>
  );
}

export default function TopBar() {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-50 w-full">
      <div className="mx-auto w-full max-w-[430px] bg-[#ffffff]">
        <div className="flex h-14 items-center justify-between px-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-full p-1"
            aria-label="뒤로가기"
          >
            <BackIcon />
          </button>

          <div className="flex items-center gap-3 text-[#f39da5]">
            <Link href="/chats" className="rounded-full p-1" aria-label="채팅">
              <ChatIcon />
            </Link>
            <Link href="/mypage" className="rounded-full p-1" aria-label="프로필">
              <ProfileIcon />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
