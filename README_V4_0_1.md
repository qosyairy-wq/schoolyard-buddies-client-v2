# Schoolyard Buddies v4.0.1 — Dark Flash Recovery

## Root cause

v4.0.0 adjusted the WebGL pixel ratio during gameplay and dispatched a synthetic
resize event after each adjustment. Three.js recreated the drawing buffer during
those changes, which could show dark or blank frames for several seconds.

## Fix

- Live dynamic resolution switching is disabled.
- Desktop uses a stable maximum DPR of 1.30.
- Mobile uses a stable maximum DPR of 1.10.
- Synthetic resize events were removed.
- Shadow maps are refreshed after the stable pixel ratio is applied.
- All other v4.0.0 performance improvements remain enabled.
