# Schoolyard Buddies v3.0.7 — Mobile Controls and Multiplayer Recovery

- Replaces unreliable touch-only joystick handling with pointer events.
- Restores joystick, action buttons and camera zones after menus close.
- Removes stale modal/input locks when no blocking screen is active.
- Multiplayer starts the WebSocket immediately instead of waiting for a separate health request.
- WebSocket timeout reduced to 7 seconds.
- Failed multiplayer attempts return cleanly to Local Play.
- Desktop keeps the v3.0.6 fullscreen store/chat behaviour.
