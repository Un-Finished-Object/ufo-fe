import { queryOptions } from "@tanstack/react-query";
import { fetchWithAuthRetry } from "@/lib/fetch/fetchWithAuthRetry";
import { buildApiUrl } from "@/lib/api/client";
import { QUERY_STALE_TIME_MS } from "@/lib/query/client";

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

export type PatternDetailData = {
  id: number;
  title: string;
  author: string;
  credits: number;
  image: string;
  isScrapped: boolean;
  stats: {
    views: number;
    scraps: number;
  };
  details: {
    category: string;
    size: string;
    measurement: string;
    needle: string;
    yarn: string;
    amount: string;
    gauge: string;
  };
};

export class PatternDetailQueryError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "PatternDetailQueryError";
  }
}

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

export function patternDetailQueryKey(patternId: number) {
  return ["patternDetail", patternId] as const;
}

export async function fetchPatternDetail(
  patternId: number,
  { signal }: { signal?: AbortSignal } = {},
) {
  const response = await fetchWithAuthRetry({
    input: buildApiUrl(`/v1/patterns/${patternId}`),
    init: {
      method: "GET",
      signal,
    },
  });

  if (response.status === 404) {
    throw new PatternDetailQueryError("Pattern not found.", 404);
  }

  if (!response.ok) {
    throw new PatternDetailQueryError("Failed to load pattern detail.", response.status);
  }

  const payload = (await response.json()) as PatternDetailResponse;

  if (
    payload.error ||
    !payload.data ||
    typeof payload.data.id !== "number" ||
    typeof payload.data.title !== "string"
  ) {
    throw new PatternDetailQueryError("Invalid pattern detail response.");
  }

  return {
    id: payload.data.id,
    title: payload.data.title,
    author: getSafeText(payload.data.author),
    image: payload.data.images?.[0] || "/image/UFO.svg",
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
  } satisfies PatternDetailData;
}

export function patternDetailQueryOptions(patternId: number) {
  return queryOptions({
    queryKey: patternDetailQueryKey(patternId),
    queryFn: ({ signal }) => fetchPatternDetail(patternId, { signal }),
    staleTime: QUERY_STALE_TIME_MS,
  });
}
