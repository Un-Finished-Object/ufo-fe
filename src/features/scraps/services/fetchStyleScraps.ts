import { buildApiUrl } from "@/lib/api/client";
import { fetchAuthenticated } from "@/lib/fetch/fetchAuthenticated";

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
  const response = await fetchAuthenticated({
    input: buildApiUrl(STYLE_SCRAPS_ENDPOINT),
    init: {
      method: "GET",
      signal,
    },
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
