# Anonymous Real-Time Chat — Backend

A **pure real-time message transport server** for a single, anonymous support-chat room.
Built with Express, TypeScript, and Socket.IO.

There is no database, no persistence, no sessions, and no multi-room support — by design.

---

## 1. Project Overview

This backend does exactly one job:

```
CONNECT → VALIDATE → ROUTE → BROADCAST
```

Anonymous users and a support agent connect over Socket.IO, join a single shared room, and
exchange messages in real time. The server never stores a message — it validates the payload,
stamps it with an id and timestamp, broadcasts it to everyone in the room, and forgets it.

## 2. Architecture

```
User 1 ──┐
User 2 ──┤
User 3 ──┼──> Express + Socket.IO ──> ONE ROOM ("support-room")
Agent  ───┘
```

- **Express** serves three small REST endpoints (anonymous id issuance, chat theme config, health).
- **Socket.IO** handles all real-time traffic: joining, messaging, typing indicators, and presence.
- **No database.** The only server-side state is an in-memory `Map<socketId, {userId, role}>` that
  is discarded per-connection and lost entirely on restart.

## 3. Single-Room Design

There is exactly **one** Socket.IO room, `support-room`. Every client — regardless of role — joins
this same room on `join_chat`. There is no `roomId`, `sessionId`, `chatId`, or `conversationId`
anywhere in this codebase, and no mechanism to create additional rooms. All messages are broadcast
to `support-room` as a whole; the frontend decides how to render a message based on `senderId`.

## 4. No-Database Design

This backend intentionally has **no MongoDB, no Mongoose, no PostgreSQL, no Redis, and no other
persistent store.** Consequences:

- Messages exist only for the duration of a single broadcast (`io.to("support-room").emit(...)`).
- If the server restarts, every socket disconnects and **all chat history is gone from the backend**
  (it was never there to begin with).
- Anonymous user ids are generated on request and immediately forgotten by the server — the
  frontend is solely responsible for persisting them.
- Connected-user presence data lives only in memory for the lifetime of a socket connection.

## 5. Installation

```bash
npm install
```

## 6. Environment Configuration

Copy the example file and adjust as needed:

```bash
cp .env.example .env
```

| Variable | Description | Default |
|---|---|---|
| `PORT` | HTTP/Socket.IO port | `5000` |
| `CLIENT_URL` | Allowed CORS origin(s) (Express **and** Socket.IO). Comma-separated for multiple — e.g. local dev + a deployed frontend. Trailing slashes are stripped automatically. | `http://localhost:5173` |
| `NODE_ENV` | `development` \| `test` \| `production` | `development` |
| `CHAT_PRIMARY_COLOR` | Chat theme primary color | `#2563EB` |
| `CHAT_SECONDARY_COLOR` | Chat theme secondary color | `#EFF6FF` |
| `CHAT_USER_MESSAGE_COLOR` | User bubble color | `#2563EB` |
| `CHAT_AGENT_MESSAGE_COLOR` | Agent bubble color | `#F3F4F6` |
| `CHAT_TEXT_COLOR` | Base text color | `#111827` |
| `CHAT_BACKGROUND_COLOR` | Chat window background | `#FFFFFF` |
| `CHAT_HEADER_COLOR` | Header background | `#2563EB` |
| `CHAT_HEADER_TEXT_COLOR` | Header text color | `#FFFFFF` |
| `CHAT_INPUT_BACKGROUND_COLOR` | Message input background | `#FFFFFF` |
| `CHAT_BORDER_RADIUS` | Chat window border radius | `12px` |

> ⚠️ **Hex colors must be quoted** in `.env` (e.g. `CHAT_PRIMARY_COLOR="#2563EB"`). Without quotes,
> `dotenv` treats the leading `#` as a comment and the value is parsed as empty. `env.ts` validates
> the hex format at startup and will fail fast with a clear error if this is done wrong.

All environment variables are parsed and validated with **Zod** in `src/config/env.ts` at startup.

## 7. Development

```bash
npm run dev
```

Runs `src/server.ts` with `tsx watch` — auto-restarts on file changes.

## 8. Production

```bash
npm run build   # compiles src/ -> dist/ with tsc
npm start       # runs dist/server.js
```

## 9. REST APIs

Only three endpoints exist. There is intentionally **no** `/api/chat/:sessionId` family of routes —
there are no sessions and the backend does not store messages.

### `POST /api/users/anonymous`

Generates a cryptographically random anonymous user id. No database write occurs; the id is not
retained by the server in any way.

```bash
curl -X POST http://localhost:5000/api/users/anonymous
```

```json
{ "userId": "anonymous_7d92ab31-1a2b-4c3d-9e0f-abc123456789" }
```

Rate-limited to 20 requests/minute/IP (`anonymousUserLimiter`).

### `GET /api/config/chat`

Returns the chat UI theme, sourced entirely from environment variables.

```bash
curl http://localhost:5000/api/config/chat
```

```json
{
  "chat": {
    "primaryColor": "#2563EB",
    "secondaryColor": "#EFF6FF",
    "userMessageColor": "#2563EB",
    "agentMessageColor": "#F3F4F6",
    "textColor": "#111827",
    "backgroundColor": "#FFFFFF",
    "headerColor": "#2563EB",
    "headerTextColor": "#FFFFFF",
    "inputBackgroundColor": "#FFFFFF",
    "borderRadius": "12px"
  }
}
```

### `GET /api/health`

```bash
curl http://localhost:5000/api/health
```

```json
{ "status": "ok" }
```

## 10. Socket.IO Events

Connect to the Socket.IO server at the same origin as the REST API (default `http://localhost:5000`).

### Client → Server

| Event | Payload | Description |
|---|---|---|
| `join_chat` | `{ userId, role }` | Joins `support-room`. Must be sent before `send_message`. |
| `send_message` | `{ userId, role, message }` | Broadcasts a message to everyone in `support-room`. |
| `typing` | `{ userId, role }` | Notifies others the user is typing. |
| `stop_typing` | `{ userId, role }` | Notifies others the user stopped typing. |
| `leave_chat` | *(none)* | Explicitly leaves the room (also happens automatically on disconnect). |

`role` must be `"user"` or `"agent"`.

### Server → Client

| Event | Payload | Description |
|---|---|---|
| `joined_chat` | `{ event, room, userId }` | Sent to the joining client only, confirming the join. |
| `message_received` | `{ messageId, senderId, senderType, message, createdAt }` | Broadcast to **everyone** in the room, including the sender. |
| `user_joined` | `{ userId, role }` | Sent to everyone **except** the joining client. |
| `user_left` | `{ userId, role }` | Sent when a user disconnects or emits `leave_chat`. |
| `user_typing` | `{ userId, role }` | Sent to everyone except the typer. |
| `user_stop_typing` | `{ userId, role }` | Sent to everyone except the typer. |
| `error` | `{ code, message }` | Validation failures, rate limiting, etc. Sent only to the offending socket. |

`error.code` is one of: `INVALID_PAYLOAD`, `NOT_JOINED`, `RATE_LIMITED`, `MESSAGE_TOO_LONG`, `INTERNAL_ERROR`.

### Message Flow Example

```js
// User A
socket.emit("send_message", { userId: "anonymous_A", role: "user", message: "Hello" });

// Every connected client (User A, User B, User C, Agent) receives:
socket.on("message_received", (msg) => {
  // {
  //   messageId: "msg_...",
  //   senderId: "anonymous_A",
  //   senderType: "user",
  //   message: "Hello",
  //   createdAt: "2026-08-23T16:00:00.000Z"
  // }
});
```

The frontend decides how to render a message by comparing `msg.senderId` to its own stored `userId`.

## 11. Frontend Integration

1. On first load, call `POST /api/users/anonymous` and store the returned `userId` (see Section 12).
2. Fetch `GET /api/config/chat` and apply the returned theme values (never hard-code colors).
3. Connect a Socket.IO client to the backend origin.
4. On connect, emit `join_chat` with `{ userId, role: "user" }` (or `"agent"` for the agent console).
5. Render `message_received` events, sending your own outgoing messages via `send_message` and
   using the server-generated `messageId` for de-duplication.
6. Wire `typing` / `stop_typing` to input focus/blur or a debounce timer, and render
   `user_typing` / `user_stop_typing` from the other party.
7. On unmount/tab-close, emit `leave_chat` (or just let the browser close the socket — the server
   detects disconnects too).

## 12. Browser Storage

The backend keeps nothing. The **frontend** is responsible for:

- `chat_user_id` — the anonymous `userId`, persisted in `localStorage`.
- `chat_messages` — the full message history, persisted in `localStorage` or (preferably, for
  larger history) `IndexedDB`.

If the backend restarts, all Socket.IO connections drop and there is no server-side chat data to
recover — but the browser's local history remains intact, and reconnecting + re-emitting
`join_chat` resumes live messaging immediately.

## 13. Security Limitations

- **`role` is client-provided and is NOT authentication.** Any socket can claim `role: "agent"`.
  This is acceptable only because this project is an authentication-free, anonymous transport
  layer by design (see the warning in `src/socket/socket.middleware.ts`). Do not build real
  agent-only privileges on top of this without adding genuine authentication.
- Helmet sets standard security headers; CORS is locked to `CLIENT_URL` (never `*`).
- Express body size is capped at `10kb`; Socket.IO payloads are capped at `64kb`
  (`maxHttpBufferSize`).
- REST rate limiting via `express-rate-limit` (300 req/15min general, 20 req/min on anonymous user
  creation).
- Socket.IO message rate limiting: **20 messages/minute/socket**, enforced in
  `src/socket/socket.rate-limiter.ts`. Violations emit `error: { code: "RATE_LIMITED" }`.
- Basic connection-flood protection: 30 new socket connections/minute/IP
  (`src/socket/socket.middleware.ts`).
- All socket payloads are validated with Zod (`src/validation/`); messages are capped at 2000
  characters.
- Centralized error handling never leaks stack traces to clients, in any environment.
- Message content is intentionally excluded from logs — only metadata (socket id, message id,
  role) is logged.

## 14. Scaling Limitations

This implementation runs **one Socket.IO server backed by one in-memory room**, on a single
process. That is sufficient for a single small support room, but it does **not** horizontally
scale as-is:

- Connected-user state and rate-limit counters live in a single process's memory. Running multiple
  backend instances behind a load balancer would split clients across disconnected in-memory
  rooms — messages from a client on instance A would never reach a client on instance B.
- There is deliberately **no Redis and no Socket.IO adapter** in this codebase, per the project's
  requirements.
- **If you need multiple backend instances** (for load or high availability), you would need to
  introduce a Socket.IO adapter (e.g. `@socket.io/redis-adapter`) backed by shared infrastructure
  (e.g. Redis pub/sub) so that a broadcast on one instance reaches sockets connected to any other
  instance. That is out of scope for this project by explicit design.

---

## Project Structure

```
src/
  config/
    env.ts                     # Zod-validated environment variables
    chat.config.ts             # Builds the chat theme payload from env
  controllers/
    anonymous-user.controller.ts
    chat-config.controller.ts
  routes/
    anonymous-user.routes.ts
    chat-config.routes.ts
    health.routes.ts
  services/
    anonymous-user.service.ts
  socket/
    socket.server.ts           # Creates & configures the Socket.IO server
    socket.handlers.ts         # join_chat / send_message / typing / leave_chat
    socket.middleware.ts       # Connection-level abuse guard + security note
    socket.rate-limiter.ts     # Per-socket message rate limiting
    connected-users.store.ts   # The ONLY server-side state (in-memory, temporary)
  middleware/
    error.middleware.ts
    rate-limit.middleware.ts
    not-found.middleware.ts
  validation/
    chat.validation.ts
    user.validation.ts
  types/
    chat.types.ts
    socket.types.ts
  utils/
    id-generator.ts
    logger.ts
  app.ts
  server.ts
```

## Docker

```bash
docker build -t chat-backend .
docker run --env-file .env -p 5000:5000 chat-backend
```

No database container is required or provided — the backend is fully self-contained.

## Graceful Shutdown

On `SIGTERM`/`SIGINT`, the server closes the Socket.IO server and the HTTP server before exiting
(with a 10s hard-exit safety net). There is no database connection to close.
