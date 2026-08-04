# Schoolyard Buddies v3.0.0 — Mobile Refactor Foundation

## Architecture
- `public/desktop.html` is preserved byte-for-byte from the supplied baseline.
- `public/mobile-game.html` is rebuilt from that desktop baseline, with one external mobile layer only.
- `public/v3-mobile.css` owns mobile viewport/HUD/fullscreen presentation.
- `public/v3-mobile.js` owns mobile menu, joystick bridge, renderer resize, modal input locking and chat fullscreen state.
- Earlier v1/v2 compatibility patches are not appended to the mobile file.

## Test URLs
- Auto route: `/`
- Force mobile: `/?mobile=1&v=3.0.0`
- Force desktop: `/?mobile=0&v=3.0.0`
- Health: `/health`

## Expected health response
`{"ok":true,"service":"schoolyard-buddies-client","build":"3.0.0"}`
