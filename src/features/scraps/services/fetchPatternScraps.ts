type PatternScrapItem = {
  id: number;
  title: string;
  author: string;
  image: string;
  isScrapped: boolean;
};

type PatternScrapResponse = {
  data?: {
    items?: Array<{
      id?: number;
      title?: string;
      author?: string;
      image?: string | null;
      thumbnailUrl?: string | null;
    }>;
  };
  error?: unknown;
};

// Assumption: this placeholder endpoint will be replaced once the pattern scrap API contract is finalized.
const PATTERN_SCRAPS_ENDPOINT = "/v1/users/me/scraps/patterns";

export async function fetchPatternScraps({ signal }: { signal?: AbortSignal } = {}) {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE ?? "/api";
  const response = await fetch(`${apiBase}${PATTERN_SCRAPS_ENDPOINT}`, {
    method: "GET",
    signal,
    credentials: "include",
  });

  if (!response.ok) {
    return [] satisfies PatternScrapItem[];
  }

  const payload = (await response.json()) as PatternScrapResponse;

  if (payload.error || !payload.data || !Array.isArray(payload.data.items)) {
    return [] satisfies PatternScrapItem[];
  }

  return payload.data.items
    .filter(
      (
        item,
      ): item is {
        id: number;
        title: string;
        author: string;
        image?: string | null;
        thumbnailUrl?: string | null;
      } =>
        typeof item.id === "number" &&
        typeof item.title === "string" &&
        typeof item.author === "string" &&
        typeof (item.image ?? item.thumbnailUrl) === "string",
    )
    .map((item) => ({
      id: item.id,
      title: item.title,
      author: item.author,
      image: item.image ?? item.thumbnailUrl ?? "",
      isScrapped: true,
    }));
}

export type { PatternScrapItem };
