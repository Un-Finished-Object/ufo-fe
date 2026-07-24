import { notFound } from "next/navigation";
import AdminChatHistoryScreen from "@/features/admin/screens/AdminChatHistoryScreen";
import { noIndexMetadata } from "@/lib/metadata";

export const metadata = noIndexMetadata;

type AdminChatHistoryPageProps = {
  params: Promise<{ chatId: string }>;
};

export default async function AdminChatHistoryPage({ params }: AdminChatHistoryPageProps) {
  const { chatId } = await params;
  const parsedChatId = Number(chatId);

  if (!Number.isInteger(parsedChatId) || parsedChatId <= 0) {
    notFound();
  }

  return <AdminChatHistoryScreen key={parsedChatId} chatId={parsedChatId} />;
}
