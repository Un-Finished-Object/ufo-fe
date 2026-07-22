import { noIndexMetadata } from "@/lib/metadata";
import ChatRoomDirectoryScreen from "@/features/chat/screens/ChatRoomDirectoryScreen";

export const metadata = noIndexMetadata;

type ChatsPageProps = {
  searchParams?: Promise<{
    page?: string | string[];
  }>;
};

function getSingleSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default async function ChatsPage({ searchParams }: ChatsPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const pageParam = getSingleSearchParam(resolvedSearchParams?.page);
  const parsedPage = Number.parseInt(pageParam, 10);
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  return <ChatRoomDirectoryScreen initialPage={page} />;
}
