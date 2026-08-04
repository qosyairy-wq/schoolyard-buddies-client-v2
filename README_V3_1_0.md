# Schoolyard Buddies v3.1.0 — Clean UI Recovery

This build removes the overlapping v3.0.4–v3.0.9 UI patches and replaces them
with one shared UI layer.

- Chat: fixed half-screen height, centred, visible X button.
- NPC dialog: fullscreen backdrop while preserving title/content/buttons layout.
- Buddy Box: same clean horizontal dialog layout.
- Store/Fitting Room/Inventory: full viewport.
- Mobile start screen: vertical scrolling restored.
- Mobile joystick: one pointer-event controller.
- Performance: no document-wide MutationObserver; only active panels are watched.
- Fitting Room preview pixel ratio capped at 1.15.
