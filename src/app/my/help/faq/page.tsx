import { myHelpPageBySlug } from "@/features/my/lib/helpPages";
import MyHelpDetailScreen from "@/features/my/screens/MyHelpDetailScreen";

export default function MyHelpFaqPage() {
  return <MyHelpDetailScreen page={myHelpPageBySlug.faq} />;
}
