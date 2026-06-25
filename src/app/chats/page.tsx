import { noIndexMetadata } from "@/lib/metadata";
import ChatRoomDirectoryScreen from "@/features/chat/screens/ChatRoomDirectoryScreen";

export const metadata = noIndexMetadata;

export default function ChatsPage() {
  return <ChatRoomDirectoryScreen />;
}
