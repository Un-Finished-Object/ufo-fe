import { headers } from "next/headers";
import { notFound } from "next/navigation";
import PatternDetailContent, {
  type PatternDetailData,
} from "@/app/patterns/[patternId]/PatternDetailContent";

type PatternDetailResponse = {
  data?: {
    id?: number;
    title?: string;
    images?: string[];
    author?: string;
    stats?: {
      views?: number;
      scraps?: number;
    };
    my?: {
      scrapped?: boolean;
    };
    meta?: {
      category?: string;
      subCategory?: string;
      gauge?: string;
      originalYarn?: string;
      originalNeedle?: string;
      requiredYarnAmount?: string;
      size?: string;
      actualSize?: string;
    };
  };
  error?: unknown;
};

type PatternDetailPageProps = {
  params: Promise<{
    patternId: string;
  }>;
};

function getSafeText(value?: string | null) {
  const trimmedValue = value?.trim();
  return trimmedValue ? trimmedValue : "-";
}

function formatCategory(category?: string, subCategory?: string) {
  const values = [category, subCategory]
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value));

  if (values.length === 0) {
    return "-";
  }

  return values.join(" > ");
}

function createFallbackPattern(
  patternId: number,
  errorMessage = "도안 정보를 불러오지 못해 기본 화면으로 표시하고 있어요.",
): PatternDetailData {
  return {
    id: patternId,
    title: "도안 상세",
    author: "-",
    image: "/mock/pattern-card.svg",
    isScrapped: false,
    errorMessage,
    credits: 20,
    stats: {
      views: 0,
      scraps: 0,
    },
    details: {
      category: "-",
      size: "-",
      measurement: "-",
      needle: "-",
      yarn: "-",
      amount: "-",
      gauge: "-",
    },
  };
}

async function getPatternDetailUrl(patternId: number) {
  const apiProxyTarget = process.env.NEXT_API_PROXY_TARGET;

  if (apiProxyTarget) {
    return `${apiProxyTarget}/v1/patterns/${patternId}`;
  }

  const configuredApiBase = process.env.NEXT_PUBLIC_API_BASE ?? "/api";

  if (configuredApiBase.startsWith("http://") || configuredApiBase.startsWith("https://")) {
    return `${configuredApiBase}/v1/patterns/${patternId}`;
  }

  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";

  if (!host) {
    throw new Error("Missing request host for pattern detail fetch.");
  }

  return new URL(
    `${configuredApiBase}/v1/patterns/${patternId}`,
    `${protocol}://${host}`,
  ).toString();
}

export default async function PatternDetailPage({
  params,
}: PatternDetailPageProps) {
  const { patternId } = await params;
  const numericPatternId = Number(patternId);

  if (Number.isNaN(numericPatternId)) {
    notFound();
  }

  try {
    const requestHeaders = await headers();
    const cookie = requestHeaders.get("cookie");
    const authorization = requestHeaders.get("authorization");
    const response = await fetch(await getPatternDetailUrl(numericPatternId), {
      method: "GET",
      cache: "no-store",
      headers: {
        ...(cookie ? { cookie } : {}),
        ...(authorization ? { authorization } : {}),
      },
    });

    if (response.status === 404) {
      notFound();
    }

    if (!response.ok) {
      return <PatternDetailContent pattern={createFallbackPattern(numericPatternId)} />;
    }

    const payload = (await response.json()) as PatternDetailResponse;

    if (
      payload.error ||
      !payload.data ||
      typeof payload.data.id !== "number" ||
      typeof payload.data.title !== "string"
    ) {
      return <PatternDetailContent pattern={createFallbackPattern(numericPatternId)} />;
    }

    const pattern: PatternDetailData = {
      id: payload.data.id,
      title: payload.data.title,
      author: getSafeText(payload.data.author),
      image: payload.data.images?.[0] || "/mock/pattern-card.svg",
      isScrapped: Boolean(payload.data.my?.scrapped),
      credits: 20,
      stats: {
        views: payload.data.stats?.views ?? 0,
        scraps: payload.data.stats?.scraps ?? 0,
      },
      details: {
        category: formatCategory(
          payload.data.meta?.category,
          payload.data.meta?.subCategory,
        ),
        size: getSafeText(payload.data.meta?.size),
        measurement: getSafeText(payload.data.meta?.actualSize),
        needle: getSafeText(payload.data.meta?.originalNeedle),
        yarn: getSafeText(payload.data.meta?.originalYarn),
        amount: getSafeText(payload.data.meta?.requiredYarnAmount),
        gauge: getSafeText(payload.data.meta?.gauge),
      },
    };

    return <PatternDetailContent pattern={pattern} />;
  } catch {
    return <PatternDetailContent pattern={createFallbackPattern(numericPatternId)} />;
  }

  notFound();
}
