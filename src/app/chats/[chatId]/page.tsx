import { noIndexMetadata } from "@/lib/metadata";
import ChatConversationScreen from "@/features/chat/screens/ChatConversationScreen";

export const metadata = noIndexMetadata;

type ChatDetailPageProps = {
  params: Promise<{
    chatId: string;
  }>;
};

export default async function ChatDetailPage({ params }: ChatDetailPageProps) {
  const { chatId } = await params;

  return <ChatConversationScreen chatId={chatId} />;
}
