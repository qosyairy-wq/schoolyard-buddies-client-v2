# Schoolyard Buddies v4.1.0 — Minimal HUD & Quiz Refactor

## Mobile HUD
- Hides verbose HUD cards during gameplay.
- Keeps the current quest in one compact responsive card.
- Uses safe-area padding and fixed non-overlapping zones.
- Existing Menu and Chat controls remain separate.

## Quiz / Buddy Box
- Uses one centred, vibrant quiz shell over a full-screen pause backdrop.
- Question text has its own inner scroll region.
- Answers have their own max-height region so buttons cannot be pushed off-screen.
- Responsive two-column desktop answers and one-column mobile answers.
- Very short landscape phones use a side-by-side question/answer layout.

## Desktop performance
- `transform: translateZ(0)` on major HUD and pop-up surfaces.
- CSS `contain` reduces layout/paint propagation.
- Removed backdrop-filter from gameplay UI.
- Quiz DOM is wrapped once at startup; no global MutationObserver and no per-frame DOM updates.
