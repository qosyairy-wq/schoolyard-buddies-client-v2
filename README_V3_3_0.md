# Schoolyard Buddies v3.3.0-hud — Fasa 3 (Console-Style HUD)

## Konsep
"SYB Console Skin" — gaya Nintendo Switch / PS5: panel kaca gelap (glassmorphism),
radius konsisten 16px, aksen emas/cyan, tipografi Fredoka/Oxanium yang sedia ada.
Dilaksanakan sebagai LAPISAN OVERLAY (satu blok <style> + satu <script> kecil
sebelum </body>) — tiada markup HUD diubah, tiada logik game disentuh, jadi
semua fungsi sedia ada (collapse −/+, toggle sound 🔊/🔇, updateHUD) kekal.

## Perubahan visual
- Semua panel HUD (player card, quest, support, level, map, quick, menu):
  kaca gelap + backdrop-blur (dengan fallback solid untuk browser lama).
- Stat pills: warna aksen ikut jenis — coin emas, XP cyan, mode hijau.
- Quest banner: bar aksen gradient di kiri.
- Bar XP/level: gradient cyan→emas dengan glow & easing lembut (0.6s).
- Menu utama: setiap butang ada chip ikon 38px dengan gradient warna kategori
  (Story ungu, Events oren, Report biru, Wardrobe pink, Focus hijau, Exit merah).
- Butang: press feedback scale(0.94), tap-highlight dibuang.
- Kawalan mobile: joystick & round buttons digilap (ring putih, shadow lembut) —
  warna asal butang interact/jump/sprint dikekalkan.
- Safe-area: HUD & kawalan di-anchor pada env(safe-area-inset-*) untuk notch.
- Micro-animation: pill coin/XP/level "pop" bila nilai berubah (MutationObserver).

## Verifikasi
- 116 (mobile) + 105 (desktop) inline script lulus Node syntax check.
- CSS skin: 48 rule, braces seimbang.
- Termasuk semua patch Fasa 1 & 2.

## Deploy
Upload folder penuh ke Cloudflare dashboard. /health → `3.3.0-hud`.
Jika mana-mana panel nampak terlalu gelap/terang atas dunia game, laraskan
--syb-glass / --syb-glass-2 dalam blok "syb-console-skin".
