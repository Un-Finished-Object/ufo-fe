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
  const numericPatternId = Number(patternId);
  const hasPurchased = Number.isNaN(numericPatternId)
    ? false
    : numericPatternId % 2 === 0;

  const pattern = {
    id: patternId,
    title: "라인패치아노락(Line Patch)",
    author: "@da0_knit대금",
    credits: 20,
    image: "/mock/pattern-card.svg",
    hasPurchased,
    details: {
      category: "의류>가디건",
      size: "XS (S) M (L)",
      measurement: "가슴둘레 : 86",
      needle: "2.5mm",
      yarn: "Gilliatt",
      amount: "(1콘/100g/5m)",
      gauge: "무늬21X30",
    },
  };

  return <PatternDetailSkeleton pattern={pattern} />;
}
