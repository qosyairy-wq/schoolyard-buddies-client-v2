# Schoolyard Buddies Client — Rebuild 1.0.3

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


## v1.0.1 hotfix
- Corrected Adventure Setup labels after DOB card reordering.
- Player Name, Main Language, Skin Tone and Date of Birth now stay mapped to the correct controls.


## Rebuild 1.0.2 reliability fixes

- Mobile enters the local Waiting Plaza before any multiplayer connection.
- Only the Waiting Plaza is built at startup; City and School are loaded on first travel.
- Mobile startup shows progress and a readable WebGL error instead of appearing frozen.
- Desktop multiplayer performs a health check and uses a 12-second WebSocket timeout.
- Automatic reconnect loops are disabled; the player controls retries.
- `multiplayer-test.html` now tests HTTP health and WebSocket separately.


## Rebuild 1.0.3 mobile fixes

- Fixed the mobile screen stack by forcing `[hidden]` elements to remain hidden.
- Adventure Setup now uses a lightweight 2D voxel character image instead of any live 3D preview.
- The Three.js engine is loaded only after the player presses Enter Waiting Plaza.
- Waiting Plaza starts offline before any multiplayer request.
- Added a full-screen Edit Character menu for skin, hair/hijab, shirt, trousers, shoes and bag colours.
- Mobile shadows and traffic start disabled; players can enable them from Settings.
- Desktop client is unchanged.

## Version 1.0.4 identity alignment hotfix

- `desktop.html` is preserved byte-for-byte and remains the single source of truth.
- Mobile and tablet routes now open the same full game contained in `desktop.html`.
- The existing adaptive mobile UI, joystick, touch camera and mobile performance limits inside `desktop.html` are used automatically.
- The simplified mobile rebuild is retained only as `mobile_legacy_rebuild_v1_0_3.*` for rollback/reference.
- PWA startup now opens the full game in landscape mode.


## v1.0.6 Mobile Start Screen Fit Hotfix
- Desktop game file remains unchanged.
- Mobile route now opens `mobile-game.html`, an identity-matched copy with mobile-only responsive overrides.
- Start and character selection screens now scroll correctly on touch devices.
- Character cards and logo scale for portrait and landscape orientations.
- Gameplay renderer and world content are unchanged.

## v1.0.9 Mobile DOB & Enter Game Hotfix
- Mobile DOB uses day/month/year selectors; no manual typing required.
- Synchronizes to the existing DOB and automatic learning-level logic.
- Makes Enter Game reliable after using the iPhone picker/keyboard.
- Desktop game file remains unchanged.


## v1.0.9 — iOS Multiplayer Interaction Hotfix
- Forces the multiplayer modal above gameplay layers on touch devices.
- Disables pointer interception by canvas/HUD siblings while the multiplayer modal is open.
- Adds reliable pointer/touch/click handling for Connect, Disconnect, top Close and bottom Close.
- Preserves desktop.html unchanged.


## v2.1.4 Desktop DOB Dropdown Hotfix
- Desktop Date of Birth now uses Day / Month / Year dropdowns.
- Keeps the original DOB backend, automatic school-level calculation, save flow and Enter Game behavior.
- Mobile gameplay and renderer are unchanged.

## v2.1.4 Mobile Gameplay Viewport, HUD and Touch Recovery
- Forces the Three.js viewport to fill the complete mobile visual viewport in portrait and landscape.
- Removes duplicate legacy mobile menu toggles and keeps one clean menu button.
- Restores the floating joystick, camera touch layer and action buttons during gameplay.
- Clears stale modal input locks after entering the world.
- Keeps controls hidden while a true full-screen menu, story modal or quiz is open.
