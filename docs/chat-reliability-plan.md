# Chat Reliability Plan

## Product Rules

- A user can have a different nickname in each chat room. The nickname returned
  by `GET /v1/users/me/chats` is the source of truth for identifying that user's
  messages in that room.
- Every authenticated user's room must receive real-time events, including rooms
  outside the first directory page.
- HTTP history and WebSocket messages are ordered by `createdAt`, with numeric
  `messageId` as the tie-breaker.
- Publishing read state resets the local unread count. The current user's
  messages do not increment unread state or create incoming-message toasts.
- The current directory pagination behavior is intentional and must not be
  changed without a separate request.

## Completed

- Load, flatten, and deduplicate every chat-room metadata page while keeping the
  directory's page query separate.
- Subscribe by the stable set of room IDs. Message and status cache updates no
  longer recreate subscriptions. Event callbacks resolve the latest nickname
  and room name from a metadata ref.
- Record a room as subscribed only after `client.subscribe()` returns a
  subscription. Clear reported subscriptions while disconnected.
- Track `connecting`, `connected`, and `disconnected` WebSocket states. Disable
  the composer and show a connection warning unless connected.
- Restart the existing STOMP client when the access token changes so reconnect
  headers use the latest token. Serialize restarts and cancel stale work after a
  newer token change or logout.
- Reconcile optimistic, HTTP, and WebSocket messages by `clientMessageId`,
  `messageId`, and creation time.
- Require `senderName` and a valid `createdAt` for HTTP and WebSocket confirmed
  messages. Invalid HTTP message data fails visibly through the message error UI.
- Treat a chat-room item with a `chatId` but malformed required metadata as an
  invalid response so the user can retry.
- Show an error and retry action when a direct conversation cannot load the full
  room collection; do not treat that failure as a missing room.
- Register `currentRoomId` only after room metadata is resolved.
- Roll back only `favorite` and `isHidden` after a status mutation fails, keeping
  concurrent last-message and unread updates.
- Observe a marker at the bottom of the rendered message list for read receipts.
- Show `참여 중인 채팅방이 없습니다.` for the unfiltered empty directory.
- Remove the unused per-room subscription hook so the app has one subscription
  owner.
- Keep only the latest failed read position per room and flush those positions on
  STOMP reconnect. Clear unread state only after publish succeeds.
- Scope pending read positions by the authenticated user ID, discard mismatched
  entries before reconnect flush, and clear the queue at logout and authenticated
  cache boundaries.
- Use WebSocket `clientMessageId` echoes as primary optimistic confirmation. If
  no echo arrives within 10 seconds, debounce pending messages into one recovery
  history refetch and mark still-unconfirmed messages as failed.
- Do not invalidate history after each successful publish. Normal confirmation
  comes from WebSocket and recovery refetches preserve pending cache records.
- Reject `hasNext: true` message pages with a missing, unchanged, or previously
  requested cursor instead of repeating a page.
- Queue up to three realtime toasts, merge consecutive events from the same room,
  show overflow count, and pause dismissal while hovered or focused.

## Deferred

- Add backend acknowledgements for read processing and message delivery. Current
  recovery can confirm broker publish and API/WebSocket visibility, but not the
  backend's final processing step.
- Reorder directory rooms from real-time last-message timestamps.
- Surface background refetch errors when cached messages remain visible.
- Expand automated coverage for parsing, pagination, reconnection, ordering,
  deduplication, and cache synchronization.
