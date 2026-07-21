# Chat Reliability Plan

## Purpose

This document tracks reliability work for chat room metadata, subscriptions,
message cache reconciliation, unread counts, and deferred WebSocket hardening.

## Confirmed Product Rules

- A user can have a different nickname in each chat room.
- The nickname returned by `GET /v1/users/me/chats` is the source of truth for
  identifying that user's messages in the corresponding room.
- Nicknames are unique within the relevant backend scope.
- All chat rooms owned by the authenticated user must receive real-time events,
  including rooms outside the first paginated result.
- HTTP message history and WebSocket messages must be reconciled using message
  creation time.
- After a read event is published, the local unread count for that room must be
  reset.
- Messages sent by the current room nickname must not increment unread counts or
  create incoming-message toasts.

## Approved Implementation Scope

Only phases 1 through 4 are approved for the next implementation. Deferred work
must not be included unless it is separately requested.

Implementation status: phases 1 through 4 were completed on 2026-07-21. The
deferred reliability backlog remains out of scope.

### Phase 1: Load Metadata and Subscribe to Every Chat Room

#### Data flow

1. Add an infinite chat room query that starts at page 1 and follows `nextPage`
   until the API returns no next page.
2. Keep the existing page-based query for the directory pagination UI.
3. Normalize both query paths with the same chat room response mapper so fields
   such as `nickname`, `favorite`, `isHidden`, and `unRead` cannot diverge.
4. Flatten and deduplicate the infinite result by `chatId`.
5. Use the complete room collection in `ChatRealtimeManager` when creating STOMP
   subscriptions.
6. Make complete metadata available to the conversation screen so a direct URL
   to a room outside page 1 still resolves its title and room-specific nickname.

#### Cache design

- Keep `myChatRoomsQueryKey` as the shared root for cache-wide room updates.
- Use distinct child keys for directory pages and the complete subscription
  collection.
- Update every cached representation of a room when last message, unread count,
  favorite state, or hidden state changes.
- Deduplicate subscriptions by `chatId` before calling `client.subscribe()`.

#### Edge cases

- Stop pagination when `nextPage` is absent, null, zero, or not greater than the
  current page.
- Detect repeated page numbers to prevent an infinite request loop.
- Do not report room IDs as subscribed until their STOMP subscriptions exist.
- Remove subscriptions for rooms that are no longer returned by the API.

#### Acceptance criteria

- A room on page 2 or later receives real-time messages and unread updates.
- Opening a later-page room directly shows its title and room nickname.
- Each room has at most one active subscription after initial connection and
  reconnection.

### Phase 2: Reconcile HTTP and WebSocket Messages by Creation Time

#### Canonical ordering

- Parse `createdAt` into a timestamp at the cache boundary.
- Sort messages by `createdAt` ascending.
- Use numeric `messageId` as the deterministic tie-breaker when timestamps are
  equal.
- Keep pending messages with no server timestamp after confirmed messages, while
  preserving their optimistic insertion order.

#### Merge identity

1. Reconcile an optimistic message with its WebSocket echo by
   `clientMessageId`.
2. Deduplicate confirmed messages by `messageId`.
3. Merge HTTP pages into existing cache data instead of replacing messages that
   arrived through WebSocket while the request was running.
4. When duplicate records exist, prefer the confirmed server record while
   retaining client-only status needed for failed or pending UI.

#### Query behavior

- Cancel the active message-history query before inserting an optimistic
  message.
- Preserve pending messages when an HTTP request completes.
- Apply the same merge-and-sort helper to HTTP results, WebSocket events, and
  optimistic confirmation.
- Do not use array position alone to determine the latest confirmed message;
  derive it from the canonical ordering.

#### Invalid timestamps

- Treat a missing or invalid `createdAt` on confirmed API and WebSocket messages
  as an invalid response.
- Do not silently order confirmed messages using the local receipt time.

#### Acceptance criteria

- A WebSocket message received during the initial HTTP request remains visible
  after the request completes.
- A pending message remains visible while history is refetched.
- Out-of-order WebSocket events render in creation-time order.
- Duplicate HTTP and WebSocket records render once.

### Phase 3: Reset Local Unread State After Publishing Read State

#### Behavior

1. Publish the latest visible confirmed message ID to `/pub/chat/read`.
2. After `publishStompMessage()` returns without throwing, set the matching
   room's `unreadCount` to zero in every chat room query cache.
3. Do not reset unread state if publishing throws because the STOMP client is
   disconnected.
4. Preserve newer unread events: only reset counts associated with messages up
   to the published read point.

#### Race handling

- Track the read operation with both `roomId` and `lastReadMessageId`.
- If a newer incoming message is processed after the read publish, its unread
  increment must remain visible.
- Prefer a shared cache helper instead of updating one directory page directly.

#### Acceptance criteria

- Returning to the room directory after reading a room shows zero unread without
  waiting for an HTTP refetch.
- A new message received after the read publish changes zero to one.
- A failed read publish does not falsely clear unread state.

### Phase 4: Suppress Unread and Toast for the Current User's Messages

#### Behavior

1. Resolve the current user's name from `room.nickname` for the event's room.
2. Normalize both names with `trim()` before comparison.
3. For a matching sender name, update `lastMessage` but do not increment unread
   and do not show a toast.
4. Continue reconciling the message cache when that room is currently open.

#### Acceptance criteria

- A message sent from another tab or device under the same room nickname does
  not create an unread badge or incoming-message toast.
- A message from a different nickname increments unread and displays a toast
  when its room is not open.
- Name comparison always uses the nickname belonging to that specific room.

## Verification for Phases 1-4

- Add unit tests for full-room pagination termination and deduplication.
- Add unit tests for creation-time sorting, ID tie-breaking, optimistic echo
  reconciliation, and HTTP/WebSocket races.
- Add cache tests for unread reset followed by a newer incoming message.
- Add event tests for own-message and other-message toast behavior.
- Run `npx tsc --noEmit`, `npm run lint`, and `npm run build`.
- Manually verify a room beyond page 1, direct room navigation, reconnection,
  another-tab sending, and read-to-directory navigation.

## Deferred Reliability Backlog

The following items were identified during the chat audit but are outside the
approved phases 1 through 4:

1. Stabilize the subscription effect so last-message and unread cache changes do
   not unsubscribe and resubscribe every room.
2. Store accurate WebSocket connection states and only mark rooms subscribed
   after `client.subscribe()` succeeds.
3. Catch read-publish failures and retry only the latest room read position after
   reconnection.
4. Reset or key the last-sent read receipt by both room ID and message ID.
5. Handle `hasNext: true` with a missing `nextMessageId` without repeating the
   initial message page.
6. Require and validate `senderName` and `createdAt` for confirmed messages.
7. Add an acknowledgement or timeout strategy for optimistic messages whose
   WebSocket echo never arrives.
8. Disable message submission or show a clear state while authentication, room
   metadata, or WebSocket connectivity is unavailable.
9. Show user-facing errors for favorite and hidden-status failures other than
   authentication errors.
10. Remove or explicitly adopt the unused `useChatRoomSubscription` hook to
    prevent future duplicate subscriptions.
11. Expand automated coverage for parsing, pagination, reconnection, ordering,
    deduplication, and cache synchronization.
