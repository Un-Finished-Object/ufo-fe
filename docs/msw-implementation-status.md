# MSW Implementation Status

## Document Purpose

This document records the current implementation status of the MSW-based API
mocking system. It separates completed work from partial or pending work so that
future implementation and backend integration can continue from a known state.

The operating guide is available in
[`docs/msw-mocking-guide.md`](./msw-mocking-guide.md).

## Objective

The mocking system supports the following development sequence:

1. Develop and verify the frontend against deterministic MSW responses.
2. Disable MSW and verify the same frontend code against the local backend.

Product services, authentication fetch wrappers, and TanStack Query functions
must use the same `/v1` URLs in both modes. Mock-specific branches must not be
added to feature services or queries.

## Current Summary

The first usable version of the browser MSW system is complete. It supports the
main REST API flows required to render and interact with the primary screens.
The original full plan is not complete because advanced scenarios, complete API
contract coverage, realtime STOMP mocking, and automated tests remain pending.

| Area | Status |
| --- | --- |
| Browser MSW infrastructure | Complete |
| Mock/local runtime switching | Complete |
| Main REST API handlers | First version complete |
| Authentication mocking | Basic flow complete |
| Mutation state synchronization | Partial |
| Error and empty scenarios | Partial |
| Server Component mocking | Partial |
| STOMP realtime mocking | Not implemented |
| Automated integration tests | Not implemented |
| Local backend contract verification | Not performed |

## Completed Work

### Infrastructure

- Added `msw` as a development dependency.
- Generated `public/mockServiceWorker.js` using the MSW CLI.
- Added `pnpm dev:mock` and `pnpm dev:local` scripts.
- Added mock configuration variables to `.env.example`.
- Added a client-side `MockProvider` that starts MSW before application queries
  are rendered.
- Added dynamic MSW imports so local mode does not start the worker.
- Added error reporting for unhandled `/v1` requests.
- Added shared success and error response helpers using the backend
  `{ data, error }` envelope.
- Added configurable response delay through `NEXT_PUBLIC_MOCK_DELAY`.

### Runtime Behavior

- Mock mode intercepts browser `/v1` requests with MSW.
- Local mode leaves MSW inactive and uses the existing Next.js rewrite to
  `NEXT_API_PROXY_TARGET`.
- Mock mode prevents the app-level STOMP connection manager from starting.
- Pattern metadata uses deterministic fixture data in mock mode because browser
  Service Workers cannot intercept server-side metadata requests.

### Fixtures and State

- Added deterministic fixtures for users, patterns, pattern details, and chat
  rooms.
- Added in-memory state for authentication, wallet balance, interests, scraps,
  purchases, attendance, user profile, and chat status.
- Added state changes for profile updates, interests, scraps, purchases,
  attendance, and chat room status.
- Mock state resets when the browser context or development server is restarted.

### Global Scenarios

The following values are supported through `NEXT_PUBLIC_MOCK_SCENARIO`:

- `default`: use normal domain handlers.
- `unauthorized`: return `401` for all `/v1` requests.
- `server-error`: return `500` for all `/v1` requests.

## Implemented API Coverage

### Authentication and User

| Method | Endpoint | Notes |
| --- | --- | --- |
| `POST` | `/v1/auth/token/refresh` | Returns a mock access token |
| `GET` | `/v1/users/me` | Requires an authorization header |
| `PATCH` | `/v1/users/me` | Updates in-memory user state |
| `POST` | `/v1/auth/logout` | Changes the mock session to unauthenticated |
| `GET` | `/v1/credits/wallet` | Returns the current mock balance |

### Home, Patterns, and Yarns

| Method | Endpoint | Notes |
| --- | --- | --- |
| `GET` | `/v1/patterns` | Returns the mock catalog |
| `GET` | `/v1/patterns/search` | Supports basic title search |
| `GET` | `/v1/patterns/recommend` | Returns recommended patterns |
| `GET` | `/v1/patterns/:patternId` | Returns detail or `404` |
| `GET` | `/v1/users/me/interests` | Returns current interests |
| `PATCH` | `/v1/users/me/interests` | Updates current interests |
| `POST` | `/v1/patterns/:patternId/scrap` | Adds a scrap |
| `DELETE` | `/v1/patterns/:patternId/scrap` | Removes a scrap |
| `GET` | `/v1/users/me/scraps` | Returns scrapped patterns |
| `GET` | `/v1/patterns/:patternId/purchase` | Returns purchase status |
| `POST` | `/v1/patterns/:patternId/purchase` | Updates purchase and wallet state |
| `GET` | `/v1/yarns/:yarnId/` | Returns a yarn detail fixture |
| `GET` | `/v1/yarns/alternatives/:setId` | Returns alternative yarn fixtures |

### Credits, Attendance, and User Activity

| Method | Endpoint | Notes |
| --- | --- | --- |
| `GET` | `/v1/credits/rules` | Returns earn and spend rules |
| `GET` | `/v1/credits/transactions` | Returns transaction fixtures |
| `GET` | `/v1/users/me/projects` | Returns purchased projects |
| `GET` | `/v1/attendance/status` | Returns attendance dates |
| `POST` | `/v1/attendance/check` | Updates attendance and wallet state |

### Styles and Chat

| Method | Endpoint | Notes |
| --- | --- | --- |
| `GET` | `/v1/styles` | Returns style feed fixtures |
| `GET` | `/v1/users/me/scraps/styles` | Returns style scraps |
| `GET` | `/v1/users/me/chats` | Returns chat rooms |
| `GET` | `/v1/chat/:chatId/messages` | Returns message history |
| `PATCH` | `/v1/chat/:chatId/status` | Updates favorite and hidden state |

### Image Upload

| Method | Endpoint | Notes |
| --- | --- | --- |
| `POST` | `/v1/images/presigned-urls` | Returns mock upload URLs |
| `PUT` | `https://mock-upload.ufo.test/:imageId` | Simulates upload success |

## Partially Implemented Work

### API Contract Inventory

The contracts used by current feature services and queries were inspected while
writing handlers. A complete endpoint inventory compared against an authoritative
backend specification has not been produced. Handler correctness is currently
based on frontend response types.

### Pagination and Filters

- Pagination fields are returned, but datasets are not fully sliced by page.
- Pattern category, subcategory, and sort behavior are not reproduced.
- Credit transaction type and reason filters are not reproduced.
- Chat message cursor pagination is not reproduced.
- Attendance year and month filtering is not reproduced.

### Mutation Consistency

The main mutations update in-memory state, but all related representations are
not guaranteed to change exactly as the backend would. Examples include derived
credit transactions, purchased project lists, and chat room creation after a
purchase.

### Authentication

Token refresh and authenticated/unauthenticated responses are available. The
following flows are not implemented:

- Mock OAuth authorize and callback flow.
- Runtime login controls after logout.
- Dedicated expired-token scenario.
- Dedicated refresh-failure scenario.
- Separate `403` authorization scenario.

### Server-Side Requests

Only pattern metadata has a server-side fixture fallback. `msw/node` is not
initialized for Server Components, metadata functions, route handlers, or other
Node-side requests.

### Image Upload

The successful two-step upload flow is supported. Partial failure, invalid file,
size rejection, expiry, and external upload network errors are not represented by
dedicated scenarios.

## Pending Work

### Endpoint-Specific Scenarios

- Empty collection responses.
- Slow response selection by endpoint.
- `403 Forbidden` responses.
- `404 Not Found` responses for all entity endpoints.
- `409 Conflict` responses for duplicate mutations.
- Malformed successful responses.
- Network failures.
- Runtime or per-test handler overrides.

### Realtime Chat

STOMP is disabled in mock mode. The following behavior remains available only
when testing against the local backend:

- Broker connection and reconnection.
- Room subscription and unsubscription.
- Message publication and reception.
- Read receipt publication.
- Realtime unread count changes.
- Realtime Query cache updates.

### Automated Testing

No test runner was added. The following remain pending:

- Vitest setup.
- React Testing Library setup.
- Node MSW `setupServer()` lifecycle.
- Per-test `server.use()` overrides.
- Authentication retry tests.
- Query cache synchronization tests.
- Mutation success and failure tests.
- Optional Playwright browser tests.
- CI execution.

Adding these tools requires a separate dependency decision because the project
normally prohibits new third-party dependencies.

### Developer Controls

- Runtime scenario selection UI.
- Mock state reset control.
- Current mock mode indicator.
- Request inspection or debug panel.
- Automatic handler coverage checks.

### Local Backend Verification

The mock system has not yet been compared against a running local backend. The
following checks are required once the backend endpoints are available:

1. Run every supported screen with `pnpm dev:local`.
2. Compare actual response payloads with MSW fixtures and handlers.
3. Resolve status code, field name, nullability, pagination, and error-envelope
   differences.
4. Verify OAuth, cookie, refresh token, and authorization behavior.
5. Verify STOMP destinations and message payloads.
6. Verify actual presigned image uploads.

## Verification Performed

The current implementation passed:

- `pnpm lint` with no warnings or errors.
- `tsc --noEmit` with no TypeScript errors.
- Next.js production build with mock-related code included.

The build generated all 28 current App Router paths successfully. Browser-based
screen-by-screen smoke testing and local backend integration testing have not yet
been recorded as complete.

## Recommended Next Steps

Work should continue in the following order:

1. Build a complete endpoint and response-contract inventory.
2. Add endpoint-specific empty, error, delay, and network scenarios.
3. Complete pagination, filter, and mutation consistency behavior.
4. Perform browser smoke tests for every primary route in mock mode.
5. Compare handlers against the running local backend.
6. Decide whether Node MSW is needed for additional Server Component fetching.
7. Decide whether automated testing dependencies can be added.
8. Add STOMP test infrastructure only if realtime development must proceed before
   the backend broker is available.

## Completion Definition

The original MSW plan should only be considered complete after:

- All frontend API calls are either handled or explicitly excluded.
- Each primary screen supports normal, loading, empty, and error verification.
- Mutation responses remain consistent with subsequent queries.
- Mock contracts match the local backend contracts.
- Mock and local modes are both smoke-tested.
- Server-side mocking requirements are resolved.
- The team explicitly decides whether realtime and automated-test scopes are
  required for completion.
