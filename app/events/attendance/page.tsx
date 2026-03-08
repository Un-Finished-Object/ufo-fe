"use client";

import { useRouter } from "next/navigation";
import AttendanceCalendar from "@/components/AttendanceCalendar";
import Footer from "@/components/Footer";
import TopBar from "@/components/TopBar";
import { useAuth } from "@/contexts/AuthContext";

export default function AttendancePage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
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
