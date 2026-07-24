import { notFound } from "next/navigation";
import { adminRouteSegments } from "@/features/admin/lib/adminRoutes";
import AdminChatHistoryScreen from "@/features/admin/screens/AdminChatHistoryScreen";
import { noIndexMetadata } from "@/lib/metadata";

export const metadata = noIndexMetadata;

type AdminChatHistoryPageProps = {
  params: Promise<{ section: string; chatId: string }>;
};

export default async function AdminChatHistoryPage({ params }: AdminChatHistoryPageProps) {
  const { section, chatId } = await params;
  const parsedChatId = Number(chatId);

  if (
    section !== adminRouteSegments.chat ||
    !Number.isInteger(parsedChatId) ||
    parsedChatId <= 0
  ) {
    notFound();
  }

  return <AdminChatHistoryScreen key={parsedChatId} chatId={parsedChatId} />;
}
