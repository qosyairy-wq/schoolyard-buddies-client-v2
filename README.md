# Schoolyard Buddies Client — Rebuild 1.0.0

This repository contains both clients:

- `public/desktop.html` — preserved full desktop game baseline.
- `public/mobile.html` — clean lightweight mobile rebuild with Waiting Plaza, Schoolyard City, School Interior, touch controls, full-screen quiz/menu and optional multiplayer.
- `public/index.html` — device router with manual fallback buttons.

## Before deploying

Open `public/config.js` and replace:

```js
wss://REPLACE-WITH-YOUR-MULTIPLAYER-WORKER.workers.dev/ws
```

with the WebSocket URL printed by the multiplayer Worker deployment.

## Cloudflare build settings

- Root directory: `/`
- Build command: leave blank
- Deploy command: `npx wrangler deploy`

## Test routes

- `/health`
- `/desktop.html`
- `/mobile.html`
- `/?desktop=1`
- `/?mobile=1`
