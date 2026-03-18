type StyleScrapItem = {
  id: number;
  title: string;
  author: string;
  image: string;
};

type StyleScrapResponse = {
  data?: {
    items?: Array<{
      id?: number;
      title?: string;
      author?: string;
      image?: string | null;
      imageUrl?: string | null;
    }>;
  };
  error?: unknown;
};

// Assumption: this placeholder endpoint will be replaced once the style scrap API contract is finalized.
const STYLE_SCRAPS_ENDPOINT = "/v1/users/me/scraps/styles";

export async function fetchStyleScraps({ signal }: { signal?: AbortSignal } = {}) {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE ?? "/api";
  const response = await fetch(`${apiBase}${STYLE_SCRAPS_ENDPOINT}`, {
    method: "GET",
    signal,
    credentials: "include",
  });

  if (!response.ok) {
    return [] satisfies StyleScrapItem[];
  }

  const payload = (await response.json()) as StyleScrapResponse;

  if (payload.error || !payload.data || !Array.isArray(payload.data.items)) {
    return [] satisfies StyleScrapItem[];
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
        imageUrl?: string | null;
      } =>
        typeof item.id === "number" &&
        typeof item.title === "string" &&
        typeof item.author === "string" &&
        typeof (item.image ?? item.imageUrl) === "string",
    )
    .map((item) => ({
      id: item.id,
      title: item.title,
      author: item.author,
      image: item.image ?? item.imageUrl ?? "",
    }));
}

export type { StyleScrapItem };
