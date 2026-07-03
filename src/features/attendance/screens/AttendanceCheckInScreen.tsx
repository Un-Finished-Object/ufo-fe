"use client";

import { useRouter } from "next/navigation";
import AttendanceCalendar from "@/features/attendance/components/AttendanceCalendar";
import Footer from "@/components/common/Footer";
import MobileShell from "@/components/layout/MobileShell";
import TopBar from "@/components/navigation/TopBar";
import { useAuthState } from "@/features/auth/hooks/useAuthState";

export default function AttendancePage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthState();
  const profileHref = isAuthenticated ? "/my" : "/login";

  return (
    <MobileShell surfaceClassName="pb-10">
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
    </MobileShell>
  );
}
