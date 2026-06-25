import { noIndexMetadata } from "@/lib/metadata";
import CommunityLandingScreen from "@/features/community/screens/CommunityLandingScreen";

export const metadata = noIndexMetadata;

export default function CommunityPage() {
  return <CommunityLandingScreen />;
}
