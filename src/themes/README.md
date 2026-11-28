# Arsitektur paket tema FlexiDesa

Setiap tema publik adalah paket mandiri di `src/themes/<slug>/<version>/`.

## Aturan isolasi

- Komponen, CSS module, stylesheet publik, konfigurasi, manifest, dan aset visual khusus tema harus berada di folder paket tema.
- Layout tema menjadi entry point stylesheet paket. Root app layout hanya memuat fondasi global (`src/app/globals.css`).
- Jangan menambahkan selector visual yang menyebut slug tema ke CSS bersama di `src/app`.
- CSS bersama hanya untuk struktur netral yang memang dipakai semua tema (misalnya kerangka header/footer, responsive primitives, dan token `--public-*`).
- Variasi visual yang hanya berlaku untuk satu tema harus memakai CSS module atau stylesheet lokal paket tersebut dan discope ke root/slug tema.
- Preview katalog boleh berada di `public/themes/<slug>/preview.svg` karena harus disajikan sebagai URL statis.
- Jangan memindahkan aset platform (logo FlexiDesa, ilustrasi login platform, dan dashboard platform) ke paket tema.

## Paket yang terdaftar

- `arunika@1.0.0`
- `cakrawala@1.0.0`
- `samudra@1.0.0`

Tes `isolation.test.ts` menjaga agar root layout tidak kembali mengimpor stylesheet tema dan setiap paket memuat stylesheet lokalnya sendiri.
