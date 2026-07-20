# MSW Mocking Guide

> Current implementation coverage and pending work are tracked in
> [`docs/msw-implementation-status.md`](./msw-implementation-status.md).

## Purpose

MSW intercepts the same `/v1` requests used with the local backend. Product services,
authentication fetch wrappers, and TanStack Query code must not branch on mock mode.

## Running the Application

```bash
pnpm dev:mock
pnpm dev:local
```

- `dev:mock` starts browser MSW and disables STOMP realtime integration.
- `dev:local` leaves MSW inactive and proxies `/v1` to `NEXT_API_PROXY_TARGET`.
- Restart the development server after changing public environment variables.

## Scenarios

Set `NEXT_PUBLIC_MOCK_SCENARIO` to one of:

- `default`: successful deterministic responses.
- `unauthorized`: all `/v1` endpoints respond with `401`.
- `server-error`: all `/v1` endpoints respond with `500`.

Use `NEXT_PUBLIC_MOCK_DELAY` to control response latency in milliseconds. Domain
handlers may add more focused empty or error fixtures when a screen requires them.

## Adding an Endpoint

1. Add deterministic API-shaped data under `src/mocks/fixtures`.
2. Add a handler to the owning domain file under `src/mocks/handlers`.
3. Register a new handler file in `src/mocks/handlers.ts`.
4. Preserve the backend `{ data, error }` envelope and actual HTTP status.
5. Require an `Authorization` header for authenticated endpoints.
6. Verify both `pnpm dev:mock` and `pnpm dev:local` behavior.

Unhandled `/v1` requests are reported as errors. External images and other non-UFO
requests bypass MSW.

## State and Limitations

Mutation handlers update in-memory state in `src/mocks/state/mockState.ts`. Reloading
the page resets that state. MSW is not a mock database.

Browser MSW cannot intercept Server Component or metadata fetches. Pattern metadata
uses a deterministic fixture in mock mode. Add Node interception only if server-side
data fetching becomes a larger application requirement.

STOMP is deliberately disabled in mock mode. Chat room and message history REST APIs
are mocked, but realtime publish/subscribe behavior must be verified with the local
backend.
