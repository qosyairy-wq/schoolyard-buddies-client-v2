# Schoolyard Buddies v4.2.0 — Minimalist Vibrant Production HUD

This uploadable build preserves all existing HUD IDs and JavaScript bindings.

## Changes
- Responsive top HUD with safe-area padding.
- Minimal glass design on desktop.
- Compact mobile HUD with non-overlapping Menu, Chat and current quest.
- Mobile removes expensive backdrop blur while keeping the same visual identity.
- `pointer-events:none` on the HUD root; buttons opt back in with `pointer-events:auto`.
- `translateZ(0)` and CSS containment on major HUD surfaces.
- No document-wide MutationObserver or per-frame HUD DOM manipulation.
- Includes reusable `public/hud-v4.2.0.css` and `public/hud-v4.2.0.js`.
