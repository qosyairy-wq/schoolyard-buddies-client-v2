# Schoolyard Buddies v3.0.8 — Chat, NPC and Fitting Room

## Chat
- Chat panel is moved directly under `body`, preventing HUD/container styles from shrinking it.
- Chat always fills the complete viewport on desktop and mobile.
- A visible red X close button is guaranteed and supports pointer, touch and click.

## NPC interaction
- NPC dialog is centred and fills the complete viewport.
- Dialogue text and options are aligned neatly and responsively.
- A visible X close button is added when the original dialog has none.

## Fitting Room performance
- Preview pixel ratio is capped at 1.15.
- The heavy 3D world update/render loop pauses while Fitting Room is open.
- The fitting preview renders at a capped 30 FPS with slower rotation.
