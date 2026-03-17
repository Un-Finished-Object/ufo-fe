import ChatDetailScreen from "./ChatDetailScreen";

type ChatDetailPageProps = {
  params: Promise<{
    patternId: string;
  }>;
};

export default async function ChatDetailPage({ params }: ChatDetailPageProps) {
  const { patternId } = await params;

  return <ChatDetailScreen patternId={patternId} />;
}
