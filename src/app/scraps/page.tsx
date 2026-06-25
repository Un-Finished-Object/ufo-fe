import { noIndexMetadata } from "@/lib/metadata";
import ScrapCollectionScreen from "@/features/scraps/screens/ScrapCollectionScreen";

export const metadata = noIndexMetadata;

export default function FavoritesPage() {
  return <ScrapCollectionScreen />;
}
