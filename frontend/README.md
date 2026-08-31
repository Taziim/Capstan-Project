# Support Chat — Frontend

A fully responsive, anonymous customer-support chat widget built with React, TypeScript, Vite, Tailwind CSS, and Socket.IO. It talks to a **stateless, single-room, anonymous real-time chat transport** (see `../simple-express-backend`) — there is no database, no sessions, and no message-history endpoint on the backend.

## Features

- Anonymous users — no signup or login. A `userId` is created on first visit and reused from `localStorage` on return visits.
- Real-time messaging over Socket.IO only — there is no REST send/fetch for messages. Sending is a fire-and-forget `send_message` emit; the only confirmation is the room-wide `message_received` broadcast (which includes the sender).
- Optimistic UI: an outgoing message renders immediately as `pending`, then is reconciled with the server's copy when it comes back over the socket (matched by sender + text, since the server doesn't echo a client-side id). A message that never comes back within a few seconds — or is rejected (e.g. rate-limited) — is marked `failed`.
- Chat history lives entirely in the browser (`localStorage`, capped to the last 500 messages) — the backend keeps nothing, so a reload restores prior messages locally while the socket rejoins the room live.
- Typing indicators in both directions, debounced.
- Chat appearance (colors, radius) is fetched from the backend at startup (`GET /api/config/chat`) and applied via CSS variables — nothing is hard-coded.
- Connection status indicator with automatic reconnection handling (re-joins the room on reconnect).
- Loading skeleton, empty state, message entrance animations, toast error notifications.
- Fully responsive: centered floating widget on desktop, full-screen on mobile.
- Accessible: keyboard navigation, aria-labels, focus states, screen-reader-friendly live regions.

## Tech stack

- React 19 + TypeScript
- Vite
- Tailwind CSS v4
- Socket.IO Client
- Axios
- Lucide React (icons)

## Project structure

```
src/
  components/Chat/
    ChatBox.tsx           # top-level container, applies theme + layout
    ChatHeader.tsx         # avatar, title, status, minimize
    MessageList.tsx        # scrollable list, skeleton, auto-scroll
    MessageBubble.tsx       # single message bubble + timestamp/status
    MessageInput.tsx        # textarea, send button, char counter
    TypingIndicator.tsx     # animated "Agent is typing..." bubble
    ConnectionStatus.tsx    # connecting/reconnecting/offline banner
    EmptyChat.tsx            # empty-state illustration + copy
    Toast.tsx                # error/info toast stack
  hooks/
    useChat.ts             # bootstrap, message state, send/typing/reconciliation logic
    useSocket.ts            # socket lifecycle + connection state
    useToast.ts              # toast queue
  services/
    api.ts                 # REST client (axios) — just anonymous user + chat config
    socket.ts                # Socket.IO client singleton
  types/chat.ts             # shared TypeScript types (wire-format-matching)
  utils/storage.ts           # localStorage helpers for userId + message history
```

## Getting started

```bash
npm install
cp .env.example .env   # adjust if your backend runs elsewhere
npm run dev
```

The app runs at `http://localhost:5173` by default.

### Environment variables

| Variable | Description | Default |
| --- | --- | --- |
| `VITE_API_URL` | Base URL of the Express REST API | `http://localhost:5000` |
| `VITE_SOCKET_URL` | Base URL of the Socket.IO server | `http://localhost:5000` |

## Backend contract

This frontend is built against `../simple-express-backend`'s API (see its README for full details). There is no `sessionId` anywhere — every client joins one implicit room, `support-room`.

**REST**

- `POST /api/users/anonymous` → `{ userId }`
- `GET /api/config/chat` → `{ chat: { primaryColor, secondaryColor, userMessageColor, agentMessageColor, textColor, backgroundColor, headerColor, headerTextColor, inputBackgroundColor, borderRadius } }`
- `GET /api/health` → `{ status: "ok" }`

**Socket.IO**

- Client emits: `join_chat { userId, role }`, `send_message { userId, role, message }`, `typing { userId, role }`, `stop_typing { userId, role }`, `leave_chat`
- Server emits: `joined_chat`, `message_received { messageId, senderId, senderType, message, createdAt }` (broadcast to everyone, including the sender), `user_joined`, `user_left`, `user_typing`, `user_stop_typing`, `error { code, message }`

To run the full stack locally:

1. `cd ../simple-express-backend && npm install && cp .env.example .env && npm run dev`
2. `cd ../simple-vite-front && npm install && npm run dev`
3. Open the app — a new anonymous `userId` is created automatically on first load and reused on subsequent visits via `localStorage`; message history is restored from `localStorage` while the socket rejoins `support-room` live.

## Available scripts

- `npm run dev` — start the Vite dev server
- `npm run build` — type-check and build for production
- `npm run preview` — preview the production build locally
- `npm run lint` — run ESLint
- merge conflict in local
- merge conflict fs
<<<<<<< Updated upstream
- dfhushdf 
=======
- ahdsfhdsfhid sfiojd 
>>>>>>> Stashed changes

