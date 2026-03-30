"use client";

import { useRouter } from "next/navigation";
import AttendanceCalendar from "@/features/attendance/components/AttendanceCalendar";
import Footer from "@/components/common/Footer";
import TopBar from "@/components/navigation/TopBar";
import { useAuthState } from "@/features/auth/hooks/useAuthState";

export default function AttendancePage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthState();
  const profileHref = isAuthenticated ? "/my" : "/login";

  return (
    <div className="min-h-screen bg-ufo-bg">
      <main className="mx-auto min-h-screen w-full max-w-[430px] bg-ufo-surface pb-10 text-ufo-text">
        <TopBar
          left="back"
          onLeftClick={() => router.back()}
          title="출석체크"
          right={[
            { type: "chat", href: "/chats", ariaLabel: "채팅" },
            { type: "profile", href: profileHref, ariaLabel: "프로필" },
          ]}
          showBottomBorder
        />
        <AttendanceCalendar />
        <Footer />
      </main>
    </div>
  );
}
