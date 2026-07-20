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
  commentId?: number;
  content?: string;
  username?: string;
  createdAt?: string;
  isMine?: boolean;
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

type UpdateAlternativeCommentResponse = {
  data?: {
    altSetId?: number;
    commentId?: number;
    content?: string;
    username?: string;
    updatedAt?: string;
  };
  error?: unknown;
};

type DeleteAlternativeCommentResponse = {
  data?: {
    altSetId?: number;
    commentId?: number;
    deletedAt?: string;
  };
  error?: unknown;
};

export type AlternativeComment = {
  commentId: number;
  content: string;
  username: string;
  createdAt: string;
  isMine: boolean;
};

export const alternativeCommentsQueryRoot = ["alternativeComments"] as const;

export function alternativeCommentsQueryKey(altSetId: number, page: number) {
  return [...alternativeCommentsQueryRoot, altSetId, page] as const;
}

function parseComment(comment: AlternativeCommentResponse): AlternativeComment | null {
  if (
    typeof comment.commentId !== "number" ||
    typeof comment.content !== "string" ||
    typeof comment.username !== "string" ||
    typeof comment.createdAt !== "string" ||
    typeof comment.isMine !== "boolean"
  ) {
    return null;
  }

  return {
    commentId: comment.commentId,
    content: comment.content,
    username: comment.username,
    createdAt: comment.createdAt,
    isMine: comment.isMine,
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

  const data = payload.data;
  if (
    !data ||
    data.altSetId !== altSetId ||
    typeof data.content !== "string" ||
    typeof data.username !== "string" ||
    typeof data.createdAt !== "string"
  ) {
    throw createInvalidApiResponseError("Invalid alternative comment response.");
  }

  return {
    altSetId,
    content: data.content,
    username: data.username,
    createdAt: data.createdAt,
  };
}

export async function updateAlternativeComment({
  altSetId,
  commentId,
  content,
}: {
  altSetId: number;
  commentId: number;
  content: string;
}) {
  const response = await fetchAuthenticated({
    input: buildApiUrl(`/v1/alternatives/${altSetId}/comments/${commentId}`),
    init: {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    },
  });

  if (!response.ok) {
    await throwApiError(response, "Failed to update alternative comment.");
  }

  const payload = (await response.json()) as UpdateAlternativeCommentResponse;
  if (payload.error) {
    throwApiPayloadError(payload.error, "Failed to update alternative comment.");
  }

  const data = payload.data;
  if (
    !data ||
    data.altSetId !== altSetId ||
    data.commentId !== commentId ||
    typeof data.content !== "string" ||
    typeof data.username !== "string" ||
    typeof data.updatedAt !== "string"
  ) {
    throw createInvalidApiResponseError("Invalid updated alternative comment response.");
  }

  return data;
}

export async function deleteAlternativeComment({
  altSetId,
  commentId,
}: {
  altSetId: number;
  commentId: number;
}) {
  const response = await fetchAuthenticated({
    input: buildApiUrl(`/v1/alternatives/${altSetId}/comments/${commentId}`),
    init: { method: "DELETE", credentials: "include" },
  });

  if (!response.ok) {
    await throwApiError(response, "Failed to delete alternative comment.");
  }

  const payload = (await response.json()) as DeleteAlternativeCommentResponse;
  if (payload.error) {
    throwApiPayloadError(payload.error, "Failed to delete alternative comment.");
  }

  const data = payload.data;
  if (
    !data ||
    data.altSetId !== altSetId ||
    data.commentId !== commentId ||
    typeof data.deletedAt !== "string"
  ) {
    throw createInvalidApiResponseError("Invalid deleted alternative comment response.");
  }

  return data;
}

export function alternativeCommentsQueryOptions(altSetId: number, page: number) {
  return queryOptions({
    queryKey: alternativeCommentsQueryKey(altSetId, page),
    queryFn: ({ signal }) => fetchAlternativeComments(altSetId, page, { signal }),
    staleTime: QUERY_STALE_TIME.critical,
  });
}
