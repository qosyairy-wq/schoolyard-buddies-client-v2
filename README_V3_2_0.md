# Schoolyard Buddies v3.2.0-perf2 — Fasa 2 (Startup & Rendering)

## Perubahan
1. **Tailwind CDN dibuang** (mobile-game.html & desktop.html).
   Audit menunjukkan hanya 8 kelas utiliti digunakan (hidden, block, font-bold,
   text-sm, text-gray-600, p-2, mb-1, mt-4) — kini disediakan sebagai CSS statik
   kecil (~1KB) berserta preflight ringkas di lokasi yang sama dalam <head>,
   jadi susunan cascade kekal. Startup lebih pantas ~1-2s di phone
   (tiada lagi JIT compile CSS dalam browser).
2. **Material factory `SYB_MAT`**: 79 penggunaan `MeshStandardMaterial` (PBR)
   kini bertukar ke `MeshLambertMaterial` secara automatik pada mobile
   (roughness/metalness dibuang, flatShading & emissive dikekalkan).
   Desktop kekal PBR. Tiada texture map PBR digunakan dalam game, jadi
   perubahan visual minimum tetapi kos shading berkurang ~separuh.
3. **FPS throttle**:
   - Loop modal preview watak 3D: cap 30fps pada mobile.
   - Loop HUD live preview: cap 30fps + skip terus bila tab hidden.
   (Preview fitting room & inventory memang render on-demand — tak perlu ubah.)
4. **Google Fonts**: preconnect ke fonts.googleapis.com & fonts.gstatic.com
   ditambah — font load lebih awal, kurang FOUT.
5. Cache SW bump `v3.2.0-perf2`, router `v=3.2.0`, worker /health `3.2.0-perf2`.

## Verifikasi
- 115 inline script (mobile) + 104 (desktop) lulus Node syntax check.
- SYB_MAT diuji: mobile → Lambert (roughness dibuang), desktop → Standard.

## Deploy
Upload folder penuh ke Cloudflare dashboard. Semak /health → `3.2.0-perf2`.
