# API Data Fetching and Server State Design

## Purpose

This document defines the architectural rules for API requests, authentication
failures, API errors, TanStack Query caching, and mutation-driven cache updates.

The objective is to keep authentication behavior explicit, preserve server error
information, and prevent different screens from displaying inconsistent server
state.

## State Ownership

TanStack Query owns all API-backed server state, including:

- Current user data
- Credit balance
- Pattern lists and details
- Scrap state
- Purchase state
- Chat room lists and message history
- User interests and recommendations

Zustand owns client-only runtime state, including:

- WebSocket connection state
- Current chat room ID
- Subscribed chat room IDs
- Temporary UI drafts
- Realtime UI state that is not the server source of truth

API data must not be copied into Zustand. Realtime events should update the
corresponding TanStack Query cache.

## Fetch Authentication Modes

Every API request must use one of three explicit fetch functions.

### Public Fetch

Use `fetchPublic` when the response is identical for authenticated and
unauthenticated users.

Rules:

- Never attach an `Authorization` header.
- Do not attempt access-token refresh.
- Default credentials to `omit`.

### Optional-Auth Fetch

Use `fetchOptionalAuth` when guests can access the endpoint but authenticated
users receive personalized fields such as `my.scrapped`.

Rules:

- Attach the current access token when one exists.
- Do not refresh solely because no access token exists.
- If a request sent with a token returns `401`, refresh once and retry once.
- Run its Query only after authentication bootstrap is complete.
- Include viewer identity in the Query key when the response is personalized.

### Authenticated Fetch

Use `fetchAuthenticated` for member-only endpoints.

Rules:

- If no access token exists, attempt refresh before the API request.
- Attach the access token to the request.
- If the request returns `401`, refresh once and retry once.
- Never retry the original request more than once.
- If the retry also returns `401`, clear the in-memory access token.

`fetchMe` is the only exception that converts `401` into `null`, because it
determines whether the application has an authenticated session. Other
authenticated requests must surface `401` as an `ApiError`.

## API Error Contract

The API error response has the following shape:

```json
{
  "data": null,
  "error": {
    "code": "404",
    "message": "Not Found"
  }
}
```

All API failures must be represented by the shared `ApiError` type.

```ts
class ApiError extends Error {
  status: number;
  code: string;
}
```

Rules:

- Preserve `error.code` and `error.message`.
- Prefer the HTTP status when it represents an error.
- If the HTTP response is successful but `error.code` contains a valid HTTP
  error code, use that code as the error status.
- Use a fallback message only when the response does not provide one.
- Use `INVALID_RESPONSE` with status `502` when a successful response does not
  match the expected data contract.
- Do not compare error message strings to determine behavior.

Consumers should inspect typed errors:

```ts
if (isApiError(error, 401)) {
  showAuthRequiredToast();
}
```

## Error and Empty-State Separation

An empty collection and a failed request are different states.

- Return an empty array only when the API successfully returns an empty array.
- Throw `ApiError` for HTTP failures and API payload errors.
- Throw an invalid-response error for malformed successful responses.
- Allow TanStack Query to expose failures through `isError` and `error`.

Do not catch network or server errors and return an empty collection. Doing so
causes failed requests to be cached as successful empty data and prevents error
UI and retry behavior from working.

## Query Freshness Policies

The global Query default is intentionally conservative:

```ts
staleTime: 0
refetchOnWindowFocus: true
refetchOnReconnect: true
```

Every server Query should explicitly select a freshness preset.

| Policy | Duration | Intended data |
| --- | ---: | --- |
| `realtime` | `0` | Chat messages and data repaired by reconnect |
| `critical` | 15 seconds | Wallet, purchase status, chat room list |
| `userState` | 1 minute | Current user, scraps, purchased projects |
| `dynamicList` | 2 minutes | BEST and NEW pattern lists |
| `personalized` | 5 minutes | Recommendations, interests, search, catalog |
| `reference` | 10 minutes | Pattern details and alternative yarn data |

`staleTime` is not a cache lifetime. It controls how long TanStack Query treats
cached data as fresh and suppresses automatic refetch triggers.

Longer freshness is appropriate only when:

- The data changes infrequently.
- Reusing it provides meaningful navigation or performance value.
- All local mutations and realtime events update or invalidate its cache.

## Query Key Design

Query keys must represent every input that changes the response.

Include:

- Resource identity
- Pagination and filters
- Search terms
- Viewer identity for personalized optional-auth responses

Examples:

```ts
["patternDetail", patternId, viewerKey]
["patterns", "catalog", category, sort, page, subCategory, viewerKey]
["patterns", "search", keyword, page, viewerKey]
```

Query key modules should expose both exact keys and root keys. Exact keys support
targeted updates, while root keys support coordinated invalidation or cleanup.

## Mutation Cache Rules

### Use Exact Server Values

When a mutation response includes the exact new value, update the cache directly
with `setQueryData` or `setQueriesData`.

Examples:

- Set wallet balance from an attendance response.
- Set profile nickname from a profile update response.
- Set chat favorite and hidden state from the chat status response.
- Set purchase status from a successful purchase response.

This avoids an unnecessary request and makes the UI immediately consistent.

### Invalidate Unknown Derived Data

When the mutation response does not include enough information to reconstruct a
cache safely, invalidate that cache.

Examples:

- Invalidate wallet when a purchase response does not include the new balance.
- Invalidate purchased projects after a pattern purchase.
- Invalidate chat rooms after purchasing chat access.
- Invalidate alternative yarn data after purchasing yarn access.
- Invalidate scrap collection pages after changing scrap state.

Await invalidation when the next UI transition depends on the refreshed result.

### Update Every Representation of an Entity

The same pattern may appear in:

- Home lists
- Recommendations
- Catalog results
- Search results
- Pattern detail
- Scrap collection

A scrap mutation must synchronize all cached representations for the active
viewer. Updating only the component's local state is insufficient because
another screen may restore stale cached data.

### Optimistic Updates

Optimistic updates should follow this sequence:

1. Cancel affected queries.
2. Snapshot previous cache values.
3. Apply the optimistic value.
4. Roll back snapshots on failure.
5. Reconcile with the server response on success.
6. Invalidate caches that cannot be reconstructed safely.

Optimistic updates are optional. Correct cross-cache synchronization is
mandatory.

## Authentication Cache Lifecycle

User-scoped caches must be removed when:

- The user logs out.
- Token refresh determines the session has expired.
- A different user completes login.
- A retried authenticated request still returns `401`.

This includes wallet, chat, purchase, scrap, activity, personalized pattern, and
viewer-scoped caches.

Clearing only the current-user Query is insufficient because another account
could otherwise receive data cached for the previous account.

## Realtime Data

WebSocket events should write directly to TanStack Query caches:

- Incoming messages update message history.
- Messages outside the current room increment unread counts.
- Connection and subscription state remain in Zustand.

Realtime Queries should remain stale so window focus and network reconnection
can refetch and repair events missed while the socket was disconnected.

## Review Checklist

When adding or modifying an API request, verify:

- The endpoint uses the correct fetch authentication mode.
- The Query waits for authentication bootstrap when required.
- The Query key includes all response-changing inputs.
- A freshness policy is explicitly selected.
- API errors preserve code, message, and status through `ApiError`.
- Empty data is not used to hide request failures.
- `401` is handled through typed status checks.
- Mutations update all known representations of affected entities.
- Unknown derived data is invalidated.
- User-scoped data is cleared when identity changes.
