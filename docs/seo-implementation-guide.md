# SEO Implementation and Maintenance Guide

## Purpose

This document records the SEO work implemented on the `feature/brand-seo`
branch and the contracts that future changes must preserve. Use it when adding
routes, changing pattern APIs, updating brand copy, or investigating indexing.

The implementation was introduced by these commits:

- `19d5a71 feat(seo): 브랜드 메타데이터와 구조화 데이터 추가`
- `c28802f feat(pattern): 도안 상세 SSR과 조회수 기록 추가`
- `57d0c35 feat(seo): 동적 도안 사이트맵 추가`
- `e7786f3 refactor(ui): 404 페이지 디자인 정리`
- `27a7f2d refactor(routes): 미사용 페이지 정리`

Google Search Console and Naver Search Advisor were already registered before
this work. Registration does not replace the deployment checks listed below.

This document reflects the repository state on 2026-07-26.

## SEO Principles

1. Only public content with standalone search value should be indexable.
2. Pattern detail content must be present in the initial server-rendered HTML.
3. Invalid or deleted pattern URLs must return HTTP 404 and `noindex`.
4. Authentication and indexing are separate concerns. `noindex` is not access
   control, and authentication is not a substitute for an indexing policy.
5. Brand names, titles, canonical URLs, and structured data must use the shared
   site configuration instead of page-local copies.
6. Sitemap timestamps must describe content dates. Do not use the sitemap
   generation time as every URL's `lastModified` value.

## Brand and Metadata Policy

### Source of truth

`src/lib/metadata.ts` is the source of truth for:

- Site URL: `https://www.knit-ufo.co.kr`
- Display name: `UFO`
- Full name: `Un-Finished Object`
- Default Korean description
- Default Open Graph image
- Instagram URL
- Theme color

When any brand property changes, update `siteConfig` first and review all of the
following consumers:

- `src/app/layout.tsx`
- `src/app/page.tsx`
- `src/app/manifest.ts`
- `src/app/robots.ts`
- `src/app/sitemap.ts`
- `src/lib/structuredData.ts`

Do not introduce a second constant for the production origin or brand name.

### Title rules

The root layout uses this title template:

```text
%s | UFO
```

Current title rules are:

| Route | Rule |
| --- | --- |
| `/` | Absolute title: `UFO | 뜨개 도안·대체 실 추천 커뮤니티` |
| `/patterns` | `뜨개 도안 | UFO` |
| `/patterns/{patternId}` | `{pattern title} | UFO` |

Pattern detail titles must not add the `뜨개 도안` prefix. Pass only the pattern
title to `createPageMetadata`; the root template adds `| UFO`.

### Canonical policy

`createPageMetadata` sets `alternates.canonical` from the supplied route path.

- `/` canonicals to `/`.
- `/patterns` canonicals to `/patterns`.
- Pattern detail pages canonical to `/patterns/{id}` using the ID returned by
  the public detail API.
- Pagination and category query variants of `/patterns` inherit the fixed
  `/patterns` metadata and therefore canonical to `/patterns`.
- `/patterns/search` is `noindex` and is not a search landing page.

Do not add filtered, sorted, paginated, or internal search URLs to the sitemap.
If a filter later becomes a deliberate keyword landing page, give it a stable
path, unique content, unique metadata, and a self-referencing canonical instead
of indexing a query-string combination.

### Search intent mapping

The current intended landing pages are:

| Search intent | Landing page |
| --- | --- |
| `UFO`, `UFO 뜨개`, `Un-Finished Object` | `/` |
| Broad service terms such as `뜨개 커뮤니티` and `대체 실 추천` | `/` until a substantial dedicated landing page exists |
| `뜨개 도안` and pattern discovery terms | `/patterns` |
| An individual pattern name | `/patterns/{patternId}` |

The removed `/community` route must not be restored as an empty keyword landing
page. A future community landing page should be indexable only after it has
unique, useful server-rendered content and a clear product destination.

### Structured data

The home page renders one JSON-LD graph from `src/lib/structuredData.ts` through
`src/components/seo/JsonLd.tsx`.

It currently contains:

- `Organization`
- `WebSite`
- `UFO` as the primary name
- `Un-Finished Object` as an alternate name
- The production origin and publisher relationship
- The public Instagram profile in `sameAs`

The JSON serializer escapes `<` to reduce script injection risk. Preserve that
behavior when modifying `JsonLd`.

The organization logo currently points to `favicon.ico`. Replace it with a
dedicated, crawlable square brand asset if one becomes available, then update
the declared dimensions to match the real file.

## Current Indexing Policy

### Indexable routes

| Route | Notes |
| --- | --- |
| `/` | Brand and broad service landing page |
| `/patterns` | Main pattern discovery page; query variants canonical here |
| `/patterns/{patternId}` | Public SSR pattern detail; valid IDs only |

### Explicitly non-indexable routes

The shared `noIndexMetadata` object sets `index: false`, `follow: false`, and the
same Googlebot directives. It is currently applied to:

- `/login` through its layout
- `/auth/*` through its layout
- `/my/*` through its layout
- `/admin/*` through its layout or page metadata
- `/styles` through its layout
- `/chats` and `/chats/{chatId}`
- `/scraps`
- `/events/attendance`
- `/patterns/search`

When adding a private, account-specific, transactional, temporary, or internal
tool route, apply `noIndexMetadata` at the narrowest shared layout or page.

### Removed routes

The following unused routes were removed and must continue to return 404 unless
the product deliberately restores them:

- `/community`
- `/my/help/faq`
- `/my/help/notices`
- `/my/help/terms`

The service terms menu uses the external `TERMS_OF_SERVICE_URL`; do not recreate
an empty internal terms route.

### Routes requiring a decision

The following routes currently inherit the root index policy and should be
reviewed before merging or deploying:

| Route | Current state | Recommended action |
| --- | --- | --- |
| `/onboarding` | Indexable by default | Add `noIndexMetadata`; it is a post-signup/product guide flow |
| `/design-gallery` | Indexable by default | Remove from production or add `noIndexMetadata`; it is an internal visual review tool |

`/design-gallery` is referenced by `docs/design-system.md`, so removing it also
requires updating that document.

## Robots Policy and Access Control

`src/app/robots.ts` currently:

- Blocks the configured AI training/extended crawler user agents from all
  routes.
- Allows normal search crawlers to crawl all routes.
- Advertises `/sitemap.xml` and the production host.

Normal crawlers are intentionally allowed to fetch non-indexable pages so they
can observe their `noindex` metadata. Do not add broad robots disallow rules for
those pages without reviewing this interaction.

The proxy currently checks for the `refresh_token` cookie on these route
prefixes:

- `/my`
- `/scraps`
- `/chats`
- `/events`

This is an early navigation guard only. The backend must still validate the
credential and authorize every private API request.

Important current gap: `/admin` has `noindex`, but it is not included in the
proxy's protected route list, and `AdminShell` does not perform a server-side
role check. Route obscurity and `noindex` are not security controls. Add a real
server/backend authorization guard before treating the admin UI as protected.

## Pattern Detail SSR Contract

### Required backend behavior

The public pattern detail endpoint must keep this behavior:

```http
GET /v1/patterns/{patternId}
Authorization: optional
```

- It must return public pattern content without authentication.
- It must not increment the view count.
- When valid authorization is present, it may include viewer-specific data such
  as `my.scrapped`.
- A missing, deleted, or non-public pattern must return HTTP 404.

The view endpoint is separate:

```http
POST /v1/patterns/{patternId}/views
Authorization: required
```

Expected response:

```json
{
  "data": {
    "viewCount": 122
  },
  "error": null
}
```

Do not move view recording back into the public GET endpoint. Server metadata,
page rendering, proxy existence checks, cache revalidation, and crawlers can all
perform GET requests and would inflate views.

### Rendering flow

1. `src/app/patterns/[patternId]/page.tsx` validates a positive safe integer ID.
2. `getPublicPatternDetail` performs an unauthenticated server fetch.
3. React `cache` shares the request between metadata generation and page
   rendering for the current render.
4. The public response becomes `initialPattern`, so the title and searchable
   detail content are in the initial HTML.
5. After authentication is known, the client performs the optional-auth detail
   query to refresh viewer-specific scrap state.
6. An authenticated client records one view for the mounted pattern through the
   POST endpoint and replaces the displayed count with the returned count.
7. Guests do not call the view endpoint.

The public detail fetch uses a five-minute revalidation period. Account-specific
state must never be included in this shared server response.

Both detail tab panels are kept in the server-rendered DOM and the inactive
panel uses the HTML `hidden` attribute. If the tabs are changed back to
conditional rendering, verify that important searchable fields such as gauge,
needle, sizing, and original yarn remain in the initial HTML.

### Metadata and 404 behavior

Pattern metadata includes:

- `{pattern title} | UFO`
- A Korean description containing the pattern title
- A canonical URL using the normalized API ID
- The first pattern image as the social image, with the site image as fallback

Next.js can stream a `notFound()` result with HTTP 200. To guarantee a real
status code, `src/proxy.ts` validates the URL shape and performs a cached public
existence check before the route renders. Invalid IDs and API 404 responses set
the downstream response status to 404; the page's `notFound()` renders the 404
UI and injects `noindex`.

The root layout intentionally does not declare global `robots: { index: true }`.
Adding it back can override or interfere with route-level and not-found robots
metadata. The default public indexing behavior is sufficient.

The proxy and page fetch the same public URL with the same five-minute cache
policy. Preserve this alignment when changing cache keys or the API origin.

## Dynamic Sitemap Contract

### Data source

The sitemap intentionally reuses the public pattern catalog API while the
catalog is small:

```http
GET /v1/patterns?category=all&sort=news&page={page}
Authorization: omitted
```

Each item used by the sitemap must include:

```ts
{
  id: number;
  createdAt: string;
}
```

The response must also include an integer `nextPage` greater than or equal to
zero. In this API, `nextPage` is used as a remaining-page signal:

- `nextPage > 0`: increment the requested page by one and continue.
- `nextPage === 0`: the current page is the last page.

The implementation does not treat `nextPage` as the next page number. This also
allows a backend that caps the displayed remaining-page count to continue until
the final page.

### Collection and validation

`fetchPublicPatternSitemapEntries`:

- Runs only on the server.
- Omits authorization.
- Fetches pages sequentially until `nextPage === 0`.
- Rejects negative or non-integer pagination values.
- Rejects a mismatched response `page` when that field is present.
- Rejects invalid IDs and invalid `createdAt` timestamps.
- Rejects an empty intermediate page.
- Stops with an error after 1,000 pages to prevent an infinite loop.
- Deduplicates by pattern ID and sorts the final result by ID.

The sitemap is deliberately all-or-nothing. Do not silently return a successful
partial sitemap when a page request or response validation fails.

### URL output and caching

`src/app/sitemap.ts` returns:

- `/` with priority `1`
- `/patterns` with priority `0.9`
- Every public `/patterns/{id}` with priority `0.8`

Pattern detail `lastModified` currently uses `createdAt`. The pattern listing
uses the newest pattern creation date. The home page omits `lastModified`.

Both the metadata route and catalog fetch use a one-hour revalidation period.
New or removed patterns may therefore take up to approximately one hour to
appear or disappear after a successful revalidation.

`createdAt` is only a temporary substitute for a real modification timestamp.
When the API exposes `updatedAt`, prefer `updatedAt ?? createdAt` and add response
validation and mock fixture coverage for the new field.

The current single sitemap is suitable only while the URL count stays below the
search engine sitemap limits. Before approaching 50,000 URLs, split the output
using Next.js `generateSitemaps` and design a catalog API that can provide stable
ranges or cursors. A dedicated lightweight sitemap endpoint should also be
considered when sequential catalog requests become expensive.

### Deployment dependency

The sitemap is statically generated with hourly revalidation. A production
build may call the catalog API. Deploy the backend response containing
`createdAt` before or together with the frontend, and ensure
`NEXT_API_PROXY_TARGET` is reachable from the frontend build/runtime
environment. Without that variable, server SEO fetches fall back to the public
site origin from `siteConfig.url`.

## File Ownership Map

| Responsibility | File |
| --- | --- |
| Brand constants and metadata helper | `src/lib/metadata.ts` |
| Root metadata and verification | `src/app/layout.tsx` |
| Brand structured data | `src/lib/structuredData.ts` |
| Safe JSON-LD rendering | `src/components/seo/JsonLd.tsx` |
| Home metadata and JSON-LD placement | `src/app/page.tsx` |
| Public pattern SSR and metadata | `src/app/patterns/[patternId]/page.tsx` |
| Public pattern server fetch | `src/features/patterns/services/fetchPublicPatternDetail.ts` |
| Detail response normalization | `src/features/patterns/lib/patternDetailData.ts` |
| Authenticated client personalization | `src/features/patterns/queries/patternDetailQueries.ts` |
| Authenticated view recording | `src/features/patterns/hooks/useRecordPatternView.ts` |
| View API transport | `src/features/patterns/services/recordPatternView.ts` |
| Real pattern 404 status and private route guard | `src/proxy.ts` |
| Sitemap output | `src/app/sitemap.ts` |
| Sitemap catalog collection | `src/features/patterns/services/fetchPublicPatternSitemapEntries.ts` |
| Crawler policy | `src/app/robots.ts` |
| Shared 404 UI | `src/app/not-found.tsx` |

## Maintenance Checklists

### Adding or changing a public route

- Decide whether the page has unique search value.
- Add unique metadata and a self-referencing canonical.
- Ensure meaningful content exists in the initial HTML.
- Add the URL to the sitemap only when it should be indexed.
- Return HTTP 404 for missing resources.
- Verify that query variants do not create duplicate indexable URLs.

### Adding or changing a private/internal route

- Add server/backend authorization where access is restricted.
- Apply `noIndexMetadata` at the page or shared layout.
- Do not rely on `robots.txt`, a hidden path, client redirects, or `noindex` for
  security.
- Keep it out of the sitemap and public structured data.

### Changing the pattern API

- Keep public detail GET unauthenticated and side-effect free.
- Keep viewer-specific fields optional.
- Keep view recording in the authenticated POST endpoint.
- Update both server and client response normalization.
- Update mock handlers and fixtures.
- Re-test SSR HTML, authenticated scrap state, view recording, and 404 behavior.
- If catalog pagination semantics change, update the sitemap loop and this
  document together.

### Changing the brand

- Update `siteConfig` first.
- Review title templates, home title, descriptions, Open Graph, Twitter,
  manifest, JSON-LD, sitemap origin, robots host, and verification tags.
- Keep `UFO` and `Un-Finished Object` usage consistent.
- Validate the real logo dimensions before changing structured data.

## Verification Procedure

Run these checks before merging an SEO change:

```bash
npm run lint
npx tsc --noEmit
NEXT_PUBLIC_API_MODE=mock npm run build
```

In a production-mode local server, verify:

- `/` returns 200 with the absolute home title, canonical, and JSON-LD.
- `/patterns` returns 200 with canonical `/patterns`.
- A valid `/patterns/{id}` returns 200 and initial HTML contains the title,
  author, gauge, needle, and original yarn content.
- Invalid IDs such as `/patterns/foo` and `/patterns/0` return HTTP 404 with
  `noindex`.
- A valid numeric but missing ID returns HTTP 404 with `noindex`.
- `/sitemap.xml` returns 200 with `application/xml`, one canonical URL per
  public pattern, and the expected `lastmod` values.
- `/robots.txt` points to the production sitemap.
- Private and internal routes return `noindex` metadata where expected.

After deployment:

1. Inspect representative home, catalog, detail, missing-detail, and private
   URLs in Google Search Console.
2. Re-submit `/sitemap.xml` in Google Search Console and Naver Search Advisor
   after a contract or URL inventory change.
3. Compare the submitted detail URL count with the number of public patterns.
4. Monitor sitemap fetch errors, soft-404 reports, duplicate canonical reports,
   and excluded-by-`noindex` URLs.
5. Search for representative pattern names and the brand queries `UFO`,
   `UFO 뜨개`, and `Un-Finished Object`; record changes over time rather than
   treating one search result as a deployment pass/fail signal.

## Known Follow-up Work

1. Add `noindex` to `/onboarding`.
2. Remove, environment-gate, or add `noindex` to `/design-gallery`.
3. Add real server/backend authorization for `/admin` routes.
4. Replace sitemap `createdAt` with `updatedAt ?? createdAt` when available.
5. Revisit a dedicated sitemap API and sitemap splitting as the catalog grows.
6. Replace the structured-data favicon logo with a verified square brand asset.
