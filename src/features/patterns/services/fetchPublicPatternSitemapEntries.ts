import "server-only";

import {
  createInvalidApiResponseError,
  throwApiError,
  throwApiPayloadError,
} from "@/lib/api/ApiError";
import { siteConfig } from "@/lib/metadata";
import { isMockMode } from "@/mocks/config";
import { mockPatterns } from "@/mocks/fixtures/core";

type PatternSitemapApiItem = {
  id?: number;
  createdAt?: string;
};

type PatternSitemapPageResponse = {
  data?: {
    items?: PatternSitemapApiItem[];
    page?: number;
    nextPage?: number;
  };
  error?: unknown;
};

export type PatternSitemapEntry = {
  id: number;
  createdAt: Date;
};

const MAX_SITEMAP_PAGES = 1_000;

function buildPatternCatalogApiUrl(page: number) {
  const apiProxyTarget = process.env.NEXT_API_PROXY_TARGET?.replace(/\/$/, "");
  const baseUrl = apiProxyTarget || siteConfig.url;
  const params = new URLSearchParams({
    category: "all",
    sort: "news",
    page: String(page),
  });

  return `${baseUrl}/v1/patterns?${params.toString()}`;
}

function normalizeEntry(item: PatternSitemapApiItem): PatternSitemapEntry {
  if (
    typeof item.id !== "number" ||
    !Number.isSafeInteger(item.id) ||
    item.id <= 0 ||
    typeof item.createdAt !== "string"
  ) {
    throw createInvalidApiResponseError("Invalid pattern sitemap item.");
  }

  const createdAt = new Date(item.createdAt);

  if (Number.isNaN(createdAt.getTime())) {
    throw createInvalidApiResponseError("Invalid pattern creation date.");
  }

  return { id: item.id, createdAt };
}

async function fetchPatternSitemapPage(page: number) {
  const response = await fetch(buildPatternCatalogApiUrl(page), {
    method: "GET",
    next: { revalidate: 3_600 },
  });

  if (!response.ok) {
    await throwApiError(response, "Failed to load patterns for sitemap.");
  }

  const payload = (await response.json()) as PatternSitemapPageResponse;

  if (payload.error) {
    throwApiPayloadError(payload.error, "Failed to load patterns for sitemap.");
  }

  if (
    !payload.data ||
    !Array.isArray(payload.data.items) ||
    typeof payload.data.nextPage !== "number" ||
    !Number.isInteger(payload.data.nextPage) ||
    payload.data.nextPage < 0 ||
    (typeof payload.data.page === "number" && payload.data.page !== page)
  ) {
    throw createInvalidApiResponseError("Invalid pattern sitemap page.");
  }

  return {
    items: payload.data.items.map(normalizeEntry),
    nextPage: payload.data.nextPage,
  };
}

function deduplicateEntries(entries: PatternSitemapEntry[]) {
  const entriesById = new Map<number, PatternSitemapEntry>();

  for (const entry of entries) {
    const previousEntry = entriesById.get(entry.id);

    if (!previousEntry || entry.createdAt > previousEntry.createdAt) {
      entriesById.set(entry.id, entry);
    }
  }

  return [...entriesById.values()].sort((a, b) => a.id - b.id);
}

export async function fetchPublicPatternSitemapEntries() {
  if (isMockMode()) {
    return deduplicateEntries(mockPatterns.map(normalizeEntry));
  }

  const entries: PatternSitemapEntry[] = [];

  for (let page = 1; page <= MAX_SITEMAP_PAGES; page += 1) {
    const result = await fetchPatternSitemapPage(page);
    entries.push(...result.items);

    if (result.nextPage === 0) {
      return deduplicateEntries(entries);
    }

    if (result.items.length === 0) {
      throw createInvalidApiResponseError(
        "Pattern sitemap pagination returned an empty intermediate page.",
      );
    }
  }

  throw createInvalidApiResponseError(
    "Pattern sitemap pagination exceeded the safety limit.",
  );
}
