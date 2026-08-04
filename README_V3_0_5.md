# Schoolyard Buddies v3.0.5 — Store Visibility Recovery

This full package fixes the blank blue screen seen after entering a shop.

## Root cause

The Shop, Fitting Room and Inventory panels are children of `#hud`.
The v3.0.4 blocking UI rule hid the whole `#hud`, which also hid the active
shop panel itself.

## Fix

- Keeps the HUD root available while a blocking panel is active.
- Hides normal HUD widgets only.
- Reveals the active Shop, Fitting Room, Inventory, quiz or dialog panel.
- Keeps the game canvas, joystick, camera and action buttons paused/hidden.
- Applies to desktop and mobile.
- Updates router, service worker, health endpoint and PWA version to 3.0.5.
