# Schoolyard Buddies v3.0.9 — Corrected UI Layout

## Chat
- Fixed 50% screen height and centred.
- Width remains large and independent of message length.
- Visible X button remains at the top-right.
- The heavy 3D world render pauses while chat is open.
- Removed the expensive document-wide chat MutationObserver.

## NPC dialog
- Restores the intended wide horizontal dialog style.
- Title remains at the top.
- Dialogue is centred in a wide box.
- Next and response buttons remain at the bottom.
- Full-screen backdrop pauses gameplay without turning the dialog into vertical columns.

## Buddy Box
- Uses the same clean wide full-screen dialog structure.
- Header, Buddy Box content and action buttons are centred correctly.
- Prevents the panel from being squeezed into the left side.
