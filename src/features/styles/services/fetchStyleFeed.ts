import { buildApiUrl } from "@/lib/api/client";
import { fetchPublic } from "@/lib/fetch/fetchPublic";
import {
  createInvalidApiResponseError,
  throwApiError,
  throwApiPayloadError,
} from "@/lib/api/ApiError";

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
  const response = await fetchPublic({
    input: buildApiUrl(STYLE_FEED_ENDPOINT),
    init: {
      method: "GET",
      signal,
    },
  });

  if (!response.ok) {
    await throwApiError(response, "Failed to load style feed.");
  }

  const payload = (await response.json()) as StyleFeedResponse;

  if (payload.error) {
    throwApiPayloadError(payload.error, "Failed to load style feed.");
  }

  if (!payload.data || !Array.isArray(payload.data.items)) {
    throw createInvalidApiResponseError("Failed to load style feed.");
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
