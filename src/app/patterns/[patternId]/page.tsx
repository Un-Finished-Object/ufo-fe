import { notFound } from "next/navigation";
import PatternDetailScreen from "@/features/patterns/screens/PatternDetailScreen";

type PatternDetailPageProps = {
  params: Promise<{
    patternId: string;
  }>;
};

export default async function PatternDetailPage({ params }: PatternDetailPageProps) {
  const { patternId } = await params;
  const numericPatternId = Number(patternId);

  if (Number.isNaN(numericPatternId)) {
    notFound();
  }

  return <PatternDetailScreen patternId={numericPatternId} />;
}
