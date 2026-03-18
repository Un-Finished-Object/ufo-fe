type StyleFeedItem = {
  id: number;
  author: string;
  likeCount: number;
  image: string;
};

type StyleFeedResponse = {
  data?: {
    items?: Array<{
      id?: number;
      author?: string;
      likeCount?: number;
      image?: string | null;
      imageUrl?: string | null;
    }>;
  };
  error?: unknown;
};

// Assumption: this placeholder endpoint will be replaced once the style feed API contract is finalized.
const STYLE_FEED_ENDPOINT = "/v1/styles";

export async function fetchStyleFeed({ signal }: { signal?: AbortSignal } = {}) {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE ?? "/api";
  const response = await fetch(`${apiBase}${STYLE_FEED_ENDPOINT}`, {
    method: "GET",
    signal,
    credentials: "include",
  });

  if (!response.ok) {
    return [] satisfies StyleFeedItem[];
  }

  const payload = (await response.json()) as StyleFeedResponse;

  if (payload.error || !payload.data || !Array.isArray(payload.data.items)) {
    return [] satisfies StyleFeedItem[];
  }

  return payload.data.items
    .filter(
      (
        item,
      ): item is {
        id: number;
        author: string;
        likeCount: number;
        image?: string | null;
        imageUrl?: string | null;
      } =>
        typeof item.id === "number" &&
        typeof item.author === "string" &&
        typeof item.likeCount === "number" &&
        typeof (item.image ?? item.imageUrl) === "string",
    )
    .map((item) => ({
      id: item.id,
      author: item.author,
      likeCount: item.likeCount,
      image: item.image ?? item.imageUrl ?? "",
    }));
}

export type { StyleFeedItem };
