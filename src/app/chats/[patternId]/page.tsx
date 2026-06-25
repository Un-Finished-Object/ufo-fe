import { noIndexMetadata } from "@/lib/metadata";
import ChatConversationScreen from "@/features/chat/screens/ChatConversationScreen";

export const metadata = noIndexMetadata;

type ChatDetailPageProps = {
  params: Promise<{
    patternId: string;
  }>;
};

export default async function ChatDetailPage({ params }: ChatDetailPageProps) {
  const { patternId } = await params;

  return <ChatConversationScreen patternId={patternId} />;
}
