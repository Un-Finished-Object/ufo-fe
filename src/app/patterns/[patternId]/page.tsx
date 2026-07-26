import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createPageMetadata, siteConfig } from "@/lib/metadata";
import PatternDetailScreen from "@/features/patterns/screens/PatternDetailScreen";
import { getPublicPatternDetail } from "@/features/patterns/services/fetchPublicPatternDetail";

type PatternDetailPageProps = {
  params: Promise<{
    patternId: string;
  }>;
};

function parsePatternId(value: string) {
  if (!/^[1-9]\d*$/.test(value)) {
    return null;
  }

  const patternId = Number(value);
  return Number.isSafeInteger(patternId) ? patternId : null;
}

export async function generateMetadata({
  params,
}: PatternDetailPageProps): Promise<Metadata> {
  const { patternId } = await params;
  const numericPatternId = parsePatternId(patternId);

  if (numericPatternId === null) {
    notFound();
  }

  const pattern = await getPublicPatternDetail(numericPatternId);

  if (!pattern) {
    notFound();
  }

  const description = `${pattern.title} 도안의 사용 실, 바늘, 게이지 정보를 UFO에서 확인해보세요.`;

  return createPageMetadata({
    title: pattern.title,
    description,
    path: `/patterns/${pattern.id}`,
    image: {
      url: pattern.image || siteConfig.ogImage.url,
      alt: `${pattern.title} 도안`,
    },
  });
}

export default async function PatternDetailPage({ params }: PatternDetailPageProps) {
  const { patternId } = await params;
  const numericPatternId = parsePatternId(patternId);

  if (numericPatternId === null) {
    notFound();
  }

  const pattern = await getPublicPatternDetail(numericPatternId);

  if (!pattern) {
    notFound();
  }

  return (
    <PatternDetailScreen
      patternId={numericPatternId}
      initialPattern={pattern}
    />
  );
}
