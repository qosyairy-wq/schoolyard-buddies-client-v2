# Schoolyard Buddies v3.0.4 — Merged Full Package

This package is based on the uploaded v3.0.3 full project and merges the uploaded
v3.0.4 universal fullscreen UI patch.

## Included fixes

- Mobile start/player-selection screen can scroll vertically.
- Mobile chat is full screen and includes a visible X close button.
- Desktop chat dynamically follows the current viewport size.
- Shop UI opened with E is full screen on desktop and mobile.
- Fitting Room and Inventory use the same full-screen flow.
- Major gameplay overlays on mobile are full-screen viewport pages.
- Gameplay canvas, HUD and controls are hidden and paused while a blocking UI is open.
- Router, Worker health endpoint, PWA manifest and Service Worker cache are versioned as 3.0.4.

## Deployment

Upload this whole project folder to the GitHub repository root, replacing the old files.
Cloudflare should build from the root containing `package.json`, `wrangler.jsonc`, `src/`
and `public/`.

Verify after deployment:

- `/health` returns build `3.0.4`
- Mobile redirects to `/mobile-game.html?...v=3.0.4&mobile=1`
- Desktop redirects to `/desktop.html?...v=3.0.4`
