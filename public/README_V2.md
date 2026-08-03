# Schoolyard Buddies Mobile Compatibility v2.1.4

Routing hotfix:
- Mobile auto-detection now opens `/mobile.html`, not `/desktop.html`.
- Desktop auto-detection continues to open `/desktop.html`.
- PWA start URL now returns to `/` so device detection runs on launch.
- Clean `/mobile` and `/desktop` routes redirect to the correct HTML entry points.
- Desktop game file is unchanged.


## v2.1.4 Loader Recovery
- Fixed an iOS Safari MutationObserver feedback loop introduced in v2.1.0.
- The loop repeatedly watched and rewrote the root style attribute, starving the main thread and leaving loading at about 3%.
- Desktop game remains unchanged.
