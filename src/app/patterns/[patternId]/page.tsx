import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createPageMetadata, siteConfig } from "@/lib/metadata";
import PatternDetailScreen from "@/features/patterns/screens/PatternDetailScreen";
import { mockPatternDetail, mockPatterns } from "@/mocks/fixtures/core";
import { isMockMode } from "@/mocks/config";

type PatternDetailPageProps = {
  params: Promise<{
    patternId: string;
  }>;
};

type PatternMetadataResponse = {
  data?: {
    id?: number;
    title?: string;
    images?: string[];
  };
};

function buildPatternMetadataApiUrl(patternId: number) {
  const apiProxyTarget = process.env.NEXT_API_PROXY_TARGET?.replace(/\/$/, "");
  const baseUrl = apiProxyTarget || siteConfig.url;

  return `${baseUrl}/v1/patterns/${patternId}`;
}

async function fetchPatternMetadata(patternId: number) {
  if (isMockMode()) {
    const pattern = mockPatterns.find((item) => item.id === patternId);
    return pattern
      ? { id: pattern.id, title: pattern.title, image: pattern.thumbnailUrl }
      : { id: mockPatternDetail.id, title: mockPatternDetail.title, image: mockPatternDetail.images[0] };
  }

  try {
    const response = await fetch(buildPatternMetadataApiUrl(patternId), {
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as PatternMetadataResponse;
    const pattern = payload.data;

    if (
      typeof pattern?.id !== "number" ||
      typeof pattern.title !== "string"
    ) {
      return null;
    }

    return {
      id: pattern.id,
      title: pattern.title,
      image: pattern.images?.[0],
    };
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: PatternDetailPageProps): Promise<Metadata> {
  const { patternId } = await params;
  const numericPatternId = Number(patternId);

  if (Number.isNaN(numericPatternId)) {
    return createPageMetadata({
      title: "뜨개 도안",
      description: "UFO에서 뜨개 도안 정보를 확인해보세요.",
      path: "/patterns",
    });
  }

  const pattern = await fetchPatternMetadata(numericPatternId);

  if (!pattern) {
    return createPageMetadata({
      title: "뜨개 도안",
      description: "UFO에서 뜨개 도안 정보를 확인해보세요.",
      path: `/patterns/${numericPatternId}`,
    });
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
  const numericPatternId = Number(patternId);

  if (Number.isNaN(numericPatternId)) {
    notFound();
  }

  return <PatternDetailScreen patternId={numericPatternId} />;
}
