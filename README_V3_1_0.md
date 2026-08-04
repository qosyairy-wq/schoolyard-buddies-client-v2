# Schoolyard Buddies v3.1.0-perf1 — Fasa 1 (Mobile Performance)

## Perubahan
1. **Logo base64 dibuang** dari mobile-game.html & desktop.html (2x setiap file, ~2.5MB) —
   kini rujuk `/assets/schoolyard-logo.png`. Saiz HTML: 5.9MB → 3.4MB.
2. **Logo PNG dioptimumkan**: 712KB → 80KB (kualiti visual dikekalkan; asal disimpan
   sebagai `schoolyard-logo.orig.png`).
3. **SYB_PERF bootstrap** ditambah di `<head>` — kesan peranti mobile dan tetapkan profil:
   - `dpr`: cap 1.5 (mobile) / 2 (desktop) — sebelum ini tidak konsisten (1.15–2.0)
   - `previewDpr`: 1.0 (mobile) / 1.35 (desktop) untuk semua canvas preview watak
   - `aa`: antialias OFF pada mobile (9 renderer dipatch)
   - `shadow`: shadow map 1024 (mobile) / 2048 (desktop)
   - `soft`: PCFShadowMap biasa pada mobile, PCFSoft pada desktop
4. **Service worker** cache bump ke `v3.1.0-perf1` + logo ditambah ke CORE cache.
5. Router `index.html` query bump `v=3.1.0`; worker `/health` build `3.1.0-perf1`.

## Tidak diubah
- Gameplay, HUD, chat, multiplayer — tiada perubahan logik.
- desktop.html: hanya base64 dibuang; rendering desktop kekal.

## Jangkaan
- Loading atas data mobile ~40% lebih pantas.
- FPS naik ketara pada Android mid-range (AA off + DPR 1.5 + shadow 1024).
- Bateri/haba berkurang pada preview watak (DPR 1.0).

## Deploy
Upload keseluruhan folder ke Cloudflare dashboard seperti biasa. Selepas deploy,
semak `https://<domain>/health` → build mesti `3.1.0-perf1`. Pengguna lama akan
dapat versi baru secara automatik (cache SW di-bump).
