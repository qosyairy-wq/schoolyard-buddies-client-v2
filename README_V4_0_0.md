# Schoolyard Buddies v4.0.0 — Performance Edition

This build is based on v3.1.1 and applies a conservative performance layer without
changing the visual identity, world design, character models or gameplay content.

## Implemented

- High-performance GPU preference requested from WebGL.
- Dynamic render resolution based on measured FPS.
- Desktop DPR capped at 1.35.
- Mobile DPR capped at 1.15.
- Minimum dynamic render scale: 0.72.
- Fitting Room preview DPR capped at 1.0.
- Background-tab pause and input reset.
- Expensive backdrop-filter disabled only on weak/mobile devices.
- Shorter UI transitions on weak/mobile devices.
- Temporary vector pool exposed through `window.SYBTemp`.
- Service Worker, router, manifest and health endpoint updated to 4.0.0.

## Static audit before optimisation

```json
{
  "desktop_bytes": 5898490,
  "mobile_bytes": 5969627,
  "new_Vector3_desktop": 171,
  "new_Vector3_mobile": 171,
  "InstancedMesh_desktop": 2,
  "InstancedMesh_mobile": 2,
  "castShadow_desktop": 43,
  "castShadow_mobile": 43,
  "setPixelRatio_desktop": 11,
  "setPixelRatio_mobile": 11,
  "requestAnimationFrame_desktop": 127,
  "requestAnimationFrame_mobile": 130
}
```

## Important limitation

This build improves runtime performance safely, but it does not fully convert the
existing single-file world into true chunks, merged geometry, texture atlases or
InstancedMesh groups. Those changes require a structural world-builder refactor
and visual regression testing for every district. They should be implemented as
v4.1+ stages rather than silently rewriting the entire world in one release.
