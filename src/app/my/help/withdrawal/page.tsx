import { myHelpPageBySlug } from "@/features/my/lib/helpPages";
import MyHelpDetailScreen from "@/features/my/screens/MyHelpDetailScreen";

export default function MyHelpWithdrawalPage() {
  return <MyHelpDetailScreen page={myHelpPageBySlug.withdrawal} />;
}
