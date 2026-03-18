import ChatConversationScreen from "@/features/chat/screens/ChatConversationScreen";

type ChatDetailPageProps = {
  params: Promise<{
    patternId: string;
  }>;
};

export default async function ChatDetailPage({ params }: ChatDetailPageProps) {
  const { patternId } = await params;

  return <ChatConversationScreen patternId={patternId} />;
}
