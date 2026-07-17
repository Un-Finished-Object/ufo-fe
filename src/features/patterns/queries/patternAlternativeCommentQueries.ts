import { queryOptions } from "@tanstack/react-query";
import { buildApiUrl } from "@/lib/api/client";
import {
  createInvalidApiResponseError,
  throwApiError,
  throwApiPayloadError,
} from "@/lib/api/ApiError";
import { fetchAuthenticated } from "@/lib/fetch/fetchAuthenticated";
import { QUERY_STALE_TIME } from "@/lib/query/client";

type AlternativeCommentResponse = {
  content?: string;
  username?: string;
  createdAt?: string;
};

type AlternativeCommentsResponse = {
  data?: {
    altSetId?: number;
    comments?: AlternativeCommentResponse[];
    page?: number;
    nextPage?: number;
  };
  error?: unknown;
};

type CreateAlternativeCommentResponse = {
  data?: AlternativeCommentResponse & { altSetId?: number };
  error?: unknown;
};

export type AlternativeComment = {
  content: string;
  username: string;
  createdAt: string;
};

export const alternativeCommentsQueryRoot = ["alternativeComments"] as const;

export function alternativeCommentsQueryKey(altSetId: number, page: number) {
  return [...alternativeCommentsQueryRoot, altSetId, page] as const;
}

function parseComment(comment: AlternativeCommentResponse): AlternativeComment | null {
  if (
    typeof comment.content !== "string" ||
    typeof comment.username !== "string" ||
    typeof comment.createdAt !== "string"
  ) {
    return null;
  }

  return {
    content: comment.content,
    username: comment.username,
    createdAt: comment.createdAt,
  };
}

export async function fetchAlternativeComments(
  altSetId: number,
  page: number,
  { signal }: { signal?: AbortSignal } = {},
) {
  const response = await fetchAuthenticated({
    input: buildApiUrl(`/v1/alternatives/${altSetId}/comments?page=${page}`),
    init: { method: "GET", credentials: "include", signal },
  });

  if (!response.ok) {
    await throwApiError(response, "Failed to load alternative comments.");
  }

  const payload = (await response.json()) as AlternativeCommentsResponse;
  if (payload.error) {
    throwApiPayloadError(payload.error, "Failed to load alternative comments.");
  }

  const data = payload.data;
  if (
    !data ||
    typeof data.altSetId !== "number" ||
    !Array.isArray(data.comments) ||
    typeof data.page !== "number" ||
    typeof data.nextPage !== "number"
  ) {
    throw createInvalidApiResponseError("Invalid alternative comments response.");
  }

  const comments = data.comments.map(parseComment);
  if (comments.some((comment) => comment === null)) {
    throw createInvalidApiResponseError("Invalid alternative comment response.");
  }

  return {
    altSetId: data.altSetId,
    comments: comments.filter((comment): comment is AlternativeComment => comment !== null),
    page: data.page,
    nextPage: data.nextPage,
  };
}

export async function createAlternativeComment({
  altSetId,
  content,
}: {
  altSetId: number;
  content: string;
}) {
  const response = await fetchAuthenticated({
    input: buildApiUrl(`/v1/alternatives/${altSetId}/comments`),
    init: {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    },
  });

  if (!response.ok) {
    await throwApiError(response, "Failed to create alternative comment.");
  }

  const payload = (await response.json()) as CreateAlternativeCommentResponse;
  if (payload.error) {
    throwApiPayloadError(payload.error, "Failed to create alternative comment.");
  }

  const comment = payload.data ? parseComment(payload.data) : null;
  if (!payload.data || payload.data.altSetId !== altSetId || !comment) {
    throw createInvalidApiResponseError("Invalid alternative comment response.");
  }

  return { altSetId, ...comment };
}

export function alternativeCommentsQueryOptions(altSetId: number, page: number) {
  return queryOptions({
    queryKey: alternativeCommentsQueryKey(altSetId, page),
    queryFn: ({ signal }) => fetchAlternativeComments(altSetId, page, { signal }),
    staleTime: QUERY_STALE_TIME.critical,
  });
}
