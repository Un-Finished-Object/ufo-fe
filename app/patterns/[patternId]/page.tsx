import PatternDetailSkeleton from "@/app/patterns/[patternId]/PatternDetailSkeleton";

type PatternDetailPageProps = {
  params: Promise<{
    patternId: string;
  }>;
};

export default async function PatternDetailPage({
  params,
}: PatternDetailPageProps) {
  const { patternId } = await params;

  const pattern = {
    id: patternId,
    title: "라인패치아노락(Line Patch)",
    author: "@da0_knit대금",
    credits: 24,
    image: "/mock/pattern-card.svg",
  };

  return <PatternDetailSkeleton pattern={pattern} />;
}
