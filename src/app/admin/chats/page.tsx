import AdminChatRoomListScreen from "@/features/admin/screens/AdminChatRoomListScreen";
import { noIndexMetadata } from "@/lib/metadata";

export const metadata = noIndexMetadata;

export default function AdminChatsPage() {
  return <AdminChatRoomListScreen />;
}
