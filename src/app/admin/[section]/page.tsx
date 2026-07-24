import { notFound } from "next/navigation";
import { adminRouteSegments } from "@/features/admin/lib/adminRoutes";
import AdminAlternativeCommentScreen from "@/features/admin/screens/AdminAlternativeCommentScreen";
import AdminChatRoomListScreen from "@/features/admin/screens/AdminChatRoomListScreen";
import AdminMainScreen from "@/features/admin/screens/AdminMainScreen";
import { noIndexMetadata } from "@/lib/metadata";

export const metadata = noIndexMetadata;

type AdminSectionPageProps = {
  params: Promise<{ section: string }>;
};

export default async function AdminSectionPage({ params }: AdminSectionPageProps) {
  const { section } = await params;

  if (section === adminRouteSegments.main) return <AdminMainScreen />;
  if (section === adminRouteSegments.chat) return <AdminChatRoomListScreen />;
  if (section === adminRouteSegments.comment) return <AdminAlternativeCommentScreen />;

  notFound();
}
