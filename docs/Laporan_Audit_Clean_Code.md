# Laporan Audit Clean Code AppDes

Tanggal: 27 November 2026 (angka snapshot diperbarui ulang pada tanggal yang
sama). Ruang lingkup: seluruh `src/` (1.369 file non-test, 365 file test),
konfigurasi root, dan `package.json` — meliputi dead code, struktur
folder/lapisan, DRY, dan konsistensi.

## Ringkasan eksekutif

| Dimensi | Skor | Catatan |
|---|---|---|
| Dead code (file & deps) | **Baik** | 0 file tak terimpor, 0 dependensi tak dipakai |
| Dead code (ekspor) | **Perlu kerja** | 149 ekspor nilai mati di file hidup |
| Struktur & lapisan | **Cukup baik** | 41/51 fitur lengkap; 10 parsial, sebagian pola belum disepakati |
| DRY | **Kurang** | Helper sama didefinisikan ulang di puluhan halaman |
| Konsistensi | **Cukup baik** | Penamaan 100% kebab-case, guard lapisan otomatis; konvensi import belum tertulis |

Kondisi kode **sehat secara umum**: `npm run typecheck` bersih dan **2.559 test
lulus** (termasuk dengan `DATABASE_URL` ke port mati — suite hermetis DB).
Dua masalah struktural yang nyata: **ekspor nilai mati** dan **duplikasi helper
di halaman publik**. Keduanya bisa dituntaskan bertahap tanpa reorganisasi besar.

## Status pelaksanaan (diperbarui 27 November 2026)

Ketujuh langkah panduan sudah dikerjakan:

| Langkah | Hasil |
|---|---|
| 1. 149 ekspor mati | **Selesai** — 136 di-unexport (masih dipakai lokal), 12 deklarasi dihapus, 1 (`PENGIKUT_PLACEHOLDER_CODES`) dihapus karena nol rujukan. F3 kini nihil. |
| 2. `mediaUrl` | **Selesai** — `src/lib/media-url.ts` + `media-url.test.ts` (5 test); 27 definisi lokal diganti impor, termasuk 6 pengimpor lewat berkas perantara. |
| 3. `formatTanggal`/`formatNumber`/`plainText` | **Selesai** — `src/lib/format-tanggal.ts` & `src/lib/plain-text.ts` + test. 6 duplikat `plainText` dihapus, 4 duplikat `formatTanggal` halaman dan 3 `formatNumber` dimigrasi. Varian domain (kembalikan input/`""`/`null`, UTC, preset surat) sengaja tidak disatukan. |
| 4. `slugify`/`escapeHtml` | **Selesai** — `slugify` di `src/lib/utils.ts` disamakan ke perilaku transliterasi (2 duplikat dihapus); `escapeHtml` dipindah ke `src/lib/sanitize.ts` (2 duplikat dihapus). |
| 5. Kunci konvensi | **Selesai** — aturan konvensi ditulis di `AGENTS.md`, `noUnusedLocals: true` aktif (19 temuan dibersihkan), guard `lapisan-publik.test.ts` diperluas menolak impor relatif lintas fitur/`db`. |
| 6. Fitur parsial | **Selesai** — use case tipis ditambahkan untuk `administrasi-desa/arsip`, `layanan-warga/buku-tamu`, `layanan-warga/pesan-warga`; bentuk domain-only, tanpa-domain, dan `kontrak` facade didokumentasikan sebagai pola sah di `AGENTS.md`. |
| 7. Tested-but-unused | **Selesai (opsi a)** — 22 berkas ditandai `// Cadangan fitur: …`; `peta-resource-modul.ts` ditandai sebagai guard aktif. Tidak ada penghapusan massal. |

Bukti: `npm run typecheck` bersih dan 2.575 test lulus sebelum pekerjaan Hubung Warga yang berjalan paralel di working tree yang sama menambahkan rute tanpa halaman. Test area yang diubah audit ini tetap hijau (137/138 berkas; satu kegagalan guard berasal dari berkas `layanan-warga/kontak/application/use-cases.ts` milik pekerjaan paralel tersebut).

## Metode dan batasannya

- Pindai graf impor + pencarian kata (word-boundary) di seluruh `src/` termasuk
  file test, lalu verifikasi manual memakai pencarian kode.
- File konvensi Next.js (`page`, `route`, `not-found`, `proxy`, …), `db/schema`
  (dibaca `drizzle-kit`), dan kontrak `themes` dikecualikan dari klaim mati
  kecuali tipe yang terverifikasi nol rujukan.
- Keterbatasan: pemakaian **dinamis** (mis. `import * as ns` lalu `ns[X]`, atau
  diakses lewat string) tidak terdeteksi graf impor, tetapi tetap tertangkap
  pencarian kata. Setiap kandidat penghapusan tetap wajib lolos typecheck + test.

## Temuan

### F1 — File tak terimpor: NIHIL (baik)

Tidak ada satu pun file di `src/` yang tidak diimpor file lain (di luar file
konvensi framework dan sumber migrasi Drizzle). Pembersihan file mati di sesi
sebelumnya (13 file) berhasil tuntas.

### F2 — Dependensi tak dipakai: NIHIL (baik)

10 paket tampak tak terimpor oleh `src/`, tetapi semuanya aktif terverifikasi:
`eslint-config-next`/`eslint-config-prettier` di `eslint.config.mjs`,
`prettier` + `@ianvs/prettier-plugin-sort-imports` di `.prettierrc.json`,
`husky`/`lint-staged` di `.husky/pre-commit`, `@commitlint/*` di
`commitlint.config.mjs`, `jsdom` lewat komentar docblock
`// @vitest-environment jsdom` di 11 file test, dan `@testing-library/dom`
adalah peer dependency `@testing-library/react`. Tidak ada yang perlu dihapus.

### F3 — 149 ekspor nilai mati di file hidup (perlu kerja)

Ekspor `const`/`function`/`class` di `src/features/**` dan `src/lib/**` yang
tidak dirujuk file mana pun (termasuk test). Pola dominan: peta label
(`*_LABELS`, `STATUS_*`), batas panjang form (`*_MAX`), skema Zod form yang
tidak lagi dipakai, dan konstanta kolom CSV.

| Area | Jumlah | Contoh |
|---|---|---|
| `pelayanan-persuratan/surat` | 15 | `ISIAN_TIPES`, `VERIFICATION_STATUS`, `toAnggotaKeluarga` |
| `layanan-warga/survey` | 13 | `TIPE_SOAL`, `BOBOT_MIN/MAKS`, `parseSkorPilihanForm` |
| `administrasi-desa/bumindes` | 10 | `KOLOM_ITEM_BUKU`, `KOLOM_MUTASI_PENDUDUK`, … |
| `kependudukan/penduduk` | 10 | `dptFilterSchema`, `normalisasiStatusPenduduk` |
| `info-desa/konten` | 9 | `STATUS_BERITA`, `JENIS_KELAMIN`, `menuPublikFormSchema` |
| `keuangan-desa/keuangan` | 8 | `PEMBUKUAN_JENIS`, `validateApbdesRow` |
| Lainnya (24 area) | 84 | Lihat Lampiran A |

Dua kategori penanganan: **unexport** (masih dipakai di file yang sama, mis.
`ACCESS_RANK`, `SUPERADMIN_SLUG`, array `PUBLIC_PATHS*` di `src/lib`) dan
**hapus deklarasi** (tidak dipakai di mana pun, mis. skema form yang sudah
digantikan). Daftar lengkap per nama ada di Lampiran A.

### F4 — Duplikasi helper di halaman publik (prioritas tertinggi)

Helper yang sama didefinisikan ulang di banyak halaman — ini bug tersembunyi
(perbaikan di satu salinan tidak memperbaiki salinan lain) dan melanggar DRY:

| Helper | Definisikan ulang di | Yang benar |
|---|---|---|
| `mediaUrl` (bangun `/api/publik/media/…`) | **27 file** | `src/lib/media-url.ts` (belum ada) |
| `formatTanggal*` (4 nama berbeda utk pekerjaan sama) | **12+ file** | `src/lib/format-tanggal.ts` |
| `plainText` (buang tag HTML) | **7 file** | `src/lib/plain-text.ts` |
| `formatNumber` (Intl id-ID) | 3 file | `src/lib/format-tanggal.ts` / util angka |
| `slugify` | 2 duplikat; kanonis sudah ada di `src/lib/utils.ts` | Pakai `slugify` dari `@/lib/utils` |
| `escapeHtml` | 2 file | Satu modul bersama |

`mediaUrl` bahkan diekspor dari beberapa halaman (`bagian-beranda.tsx`,
`bagian-wilayah.tsx`, `bagian-pemerintahan.tsx`, `detail-domain-bagian.tsx`)
sehingga salinan-salinan itu ikut memperbesar permukaan API modul.

### F5 — Struktur fitur: 41 lengkap, 10 parsial

51 fitur di `src/features/**`: 41 memiliki minimal 3 layer
(`application`/`domain`/`infrastructure`/`presentation`), 10 parsial:

- **Domain-only (4):** `info-desa/konten`, `kependudukan/pemilihan`,
  `layanan-warga/umpan-balik`, `pengaturan/modul` — sah secara pola
  (kontrak shared/data), tetapi belum terdokumentasi mana yang disengaja.
- **Tanpa application (3):** `administrasi-desa/arsip`, `layanan-warga/buku-tamu`,
  `layanan-warga/pesan-warga` — `infrastructure` langsung tanpa use case
  melanggar batas lapisan yang dijaga test; perlu diputuskan: tambah use case
  atau hapus fitur.
- **Tanpa domain (2):** `info-desa/status-desa`, `kehadiran/kepegawaian` —
  use case langsung dari repository; sah untuk fitur tipis, catat sebagai
  pengecualian.
- **Tanpa keduanya (1):** `program-data-desa/potensi-sarana` memakai pola
  `application`+`infrastructure` dengan nama `kontrak` sebagai facade — pola
  ini tidak diikuti fitur lain.

Lapisan `presentation` hanya ada di 10/51 fitur; UI admin menumpuk di
`src/app/(admin)` (446 file). Ini konsisten dengan pola "halaman di route,
use case di fitur", tetapi membuat audit UI tersebar. Bukan pelanggaran —
tetapi konvensi ini belum tertulis di mana pun.

### F6 — Konsistensi (mayoritas baik)

- **Baik:** 100% nama file kebab-case; hanya 2 `index.ts` (barrel hampir tidak
  dipakai — konsisten); test terkolokasi (`*.test.ts(x)` di samping sumber);
  `tsconfig` ketat (`strict`, `noUncheckedIndexedAccess`); guard lapisan
  otomatis (`lapisan-publik.test.ts`, `lapisan-antar-fitur.test.ts`,
  `ui-guard.test.ts`).
- **Belum tertulis:** impor memakai alias `@/` jauh lebih dominan dibanding
  relatif. Impor relatif wajar untuk CSS module & komponen sefolder, tetapi
  belum ada aturan tertulis; impor relatif antar-fitur berisiko merusak batas
  lapisan yang dijaga test (test hanya memeriksa impor `@/db` & infrastructure).
- **Celah compiler:** `noUnusedLocals`/`noUnusedParameters` mati (default
  `tsc`), sehingga ekspor mati (F3) tidak tertangkap tipe. Mengaktifkannya
  adalah keputusan sadar: itu menandai variabel lokal tak terpakai, bukan
  ekspor tak terpakai — tidak menggantikan audit ekspor, tetapi menutup
  sumber sampah baru.

### F7 — 21 file "tested but unused" (putuskan per modul)

21 file domain/application di `src/features/**` hanya dirujuk oleh file
test-nya sendiri, tidak oleh kode produksi (mis. `login-otp-use-cases.ts`,
`notifikasi-use-cases.ts`, `survei rekap`, `sisa-lebih*`, `kiosk-use-cases.ts`).
Sebagian adalah guard yang disengaja (`ui-guard-baseline.ts`,
`peta-resource-modul.ts` — **jangan dihapus**). Sisanya adalah kode teruji yang
tak dipakai produksi: biarkan (cadangan fitur) atau hapus beserta test-nya —
keputusan per modul oleh pemiliknya, bukan pembersihan massal.

## Panduan implementasi

Kerjakan berurutan; **setiap langkah wajib lolos typecheck + test sebelum lanjut**.
Perintah standar: `npm run typecheck`, `npm test` (skema penuh: 2.559 test), dan
`npx prettier --check <file>`.

### Langkah 1 — Bersihkan 149 ekspor nilai mati (per area, ±5 area/batch)

Untuk tiap nama di Lampiran A, terapkan aturan yang sama seperti batch tipe
sebelumnya (codemod `unexport` bila dipakai lokal; hapus deklarasi utuh bila
tidak dipakai di mana pun). Urutan aman: `layanan-warga/survey` →
`pelayanan-persuratan/surat` → `administrasi-desa/bumindes` →
`kependudukan/penduduk` → sisanya. Verifikasi tiap batch: `npm run typecheck`
lalu `npm test -- src/features/<area>`. File di `src/app/**` dikecualikan
lagi (ekspor konvensi Next.js).

### Langkah 2 — Satukan `mediaUrl` → `src/lib/media-url.ts`

Buat satu `export function mediaUrl(value, villageId)` yang dipakai 27 situs;
hapus definisi lokal dan impor dari modul bersama. Tambah unit test
(`media-url.test.ts`) untuk kasus: nama mulai villageId, path bersarang,
`../`/titik-titik di tengah path, nilai kosong. Ini satu-satunya refactor yang
menyentuh halaman publik massal — kerjakan satu PR khusus dan periksa visual
halaman publik sesudahnya (hero/beranda/galeri memakai helper ini).

### Langkah 3 — Satukan `formatTanggal` + `formatNumber` + `plainText`

- `src/lib/format-tanggal.ts`: satu `formatTanggal(value)` (Intl `id-ID`,
  opsi tanggal) + `formatNumber`. Penyamaan 4 varian nama (`formatTanggal`,
  `formatTanggalIndonesia`, `formatTanggalSurat`, `formatTanggalKeluarga`)
  termasuk menyelaraskan perbedaan output (ada yang mengembalikan `null`,
  ada yang string kosong) — samakan semantiknya, lalu hapus semua duplikat.
  Perhatian: definisi di `domain` (mis. `surat.ts`, `keluarga.ts`) mungkin
  membawa timezone/UTC yang berbeda — bandingkan isi sebelum menyatukan.
- `src/lib/plain-text.ts`: satu `plainText(value, max)`; hapus 7 salinan.

### Langkah 4 — `slugify` dan `escapeHtml`

Ganti 2 duplikat `slugify` dengan impor `@/lib/utils`; satukan `escapeHtml`
ke satu modul (pilih `src/lib/sanitize.ts` yang sudah ada bila isinya cocok).

### Langkah 5 — Kunci konvensi agar tidak kambuh

1. Tambah aturan tertulis di `AGENTS.md`: impor alias untuk lintas fitur,
   relatif hanya untuk sefolder/CSS; helper lintas halaman wajib di `src/lib`.
2. Pertimbangkan `noUnusedLocals: true` di `tsconfig.json` — aktifkan sekali,
   perbaiki temuan, lalu kunci. (Jangan aktifkan `noUnusedParameters` tanpa
   memeriksa override fungsi framework seperti `GET(req, ctx)`.)
3. Terapkan perluasan `lapisan-publik.test.ts` ke impor relatif lintas fitur
   bila 3 file penanda (`layanan-form.tsx`, `survei-form.tsx`,
   `satu-data/.../actions.ts`) sudah dimigrasi ke alias.

### Langkah 6 — Putuskan struktur 10 fitur parsial (F5)

Satu keputusan per fitur, dicatat di `AGENTS.md` sebagai pengecualian sah atau
disesuaikan:
- Tambah use case tipis untuk `arsip`, `buku-tamu`, `pesan-warga`
  (application yang sekadar meneruskan + validasi), atau hapus
  `infrastructure`-nya bila fitur memang belum dipakai.
- Dokumentasikan `domain-only` dan `kontrak` sebagai pola sah, atau migrasi
  `potensi-sarana` ke `application` standar.

### Langkah 7 — Putuskan 21 file tested-but-unused (F7)

Minta pemilik per area memilih: (a) biarkan + tandai komentar
"cadangan fitur, belum dipakai produksi", atau (b) hapus file + test-nya.
Jangan sapu massal — `ui-guard-baseline.ts` dan `peta-resource-modul.ts` adalah
guard aktif dan tidak boleh dihapus.

## Lampiran A — 149 ekspor nilai mati (per file)

Lihat daftar mentah hasil pindai (file + nama). Dapat diregenerasi dengan
mengulang pencarian kata untuk pola
`export (const|function|class) <NAMA>` di `src/features/**` + `src/lib/**`
terhadap seluruh `src/` termasuk file test.

| File | Nama |
|---|---|
| `src/db/kunci-mysql.ts` | `TIMEOUT_KUNCI_DETIK` |
| `src/features/administrasi-desa/bumindes/domain/buku-resmi.ts` | `KOLOM_ITEM_BUKU`, `KOLOM_MUTASI_PENDUDUK`, `KOLOM_TANAH_KAS`, `KOLOM_MUTASI_TANAH_KAS`, `KOLOM_PEMBANGUNAN`, `KOLOM_KADER`, `KOLOM_PERATURAN`, `KOLOM_APARAT`, `KOLOM_AGENDA` |
| `src/features/administrasi-desa/bumindes/domain/bumindes.ts` | `KETERANGAN_ITEM_MAX` |
| `src/features/api-eksternal/domain/openapi.ts` | `JALUR_API_EKSTERNAL` |
| `src/features/info-desa/agenda/domain/agenda.ts` | `AGENDA_STATUS` |
| `src/features/info-desa/desa/domain/statistik-publik-csv.ts` | `KOLOM_CSV_STATISTIK`, `csvCellStatistik` |
| `src/features/info-desa/identitas-desa/application/validasi-media.ts` | `TIPE_DIIZINKAN`, `BATAS_UKURAN` |
| `src/features/info-desa/identitas-desa/domain/identitas-form.ts` | `UKURAN_LOGO_MIN`, `UKURAN_LOGO_MAKS` |
| `src/features/info-desa/konten/domain/berita.ts` | `STATUS_BERITA`, `STATUS_BERITA_LABELS` |
| `src/features/info-desa/konten/domain/menu.ts` | `MENU_LINK_TIPE`, `menuPublikFormSchema` |
| `src/features/info-desa/konten/domain/perangkat.ts` | `STATUS_PERANGKAT`, `STATUS_PERANGKAT_LABELS`, `JENIS_KELAMIN`, `JENIS_KELAMIN_LABELS`, `PERIODE_JABATAN` |
| `src/features/info-desa/pemerintahan/domain/aparat-desa.ts` | `SIMPUL_BPD` |
| `src/features/info-desa/publik/domain/dokumen.ts` | `DOKUMEN_KATEGORI_LABELS`, `DOKUMEN_PAGE_SIZE` |
| `src/features/info-desa/publik/domain/inventaris-publik.ts` | `KOLOM_CSV_INVENTARIS` |
| `src/features/info-desa/publik/domain/rekap-survei.ts` | `PERIODE_MIN`, `PERIODE_MAKS` |
| `src/features/info-desa/wilayah/domain/data-wilayah.ts` | `POLA_INDUK` |
| `src/features/kehadiran/kehadiran/domain/jam-kerja.ts` | `NAMA_HARI` |
| `src/features/kehadiran/kehadiran/domain/pengajuan-izin.ts` | `JENIS_PENGAJUAN_NILAI` |
| `src/features/kependudukan/kelompok/domain/kelompok.ts` | `KELOMPOK_TIPE_LABELS`, `JABATAN_LABELS`, `KELOMPOK_STATUS_FILTERS`, `KELOMPOK_STATUS_DEFAULT` |
| `src/features/kependudukan/keluarga/domain/keluarga.ts` | `AKSI_LOG_ANGGOTA` |
| `src/features/kependudukan/penduduk/application/suplemen-use-cases.ts` | `pisahkanKeterangan` |
| `src/features/kependudukan/penduduk/domain/dpt.ts` | `dptFilterSchema` |
| `src/features/kependudukan/penduduk/domain/penduduk-import.ts` | `MAKS_BARIS_IMPOR_PENDUDUK`, `normalisasiStatusPenduduk`, `normalisasiStatusTinggal` |
| `src/features/kependudukan/penduduk/domain/suplemen-berkas.ts` | `MAKS_PANJANG_NILAI_ISIAN`, `MAKS_KOLOM_ISIAN`, `CATATAN_EKSPOR_SUPLEMEN` |
| `src/features/kependudukan/penduduk/domain/suplemen.ts` | `suplemenFormFieldSchema`, `keteranganTerdataSchema` |
| `src/features/kependudukan/rumah-tangga/domain/rumah-tangga.ts` | `RTM_LEVELS`, `RTM_LEVEL_LABELS`, `RTM_LIFE_STATUS_LABELS`, `RTM_BDT_FILTERS`, `RTM_DTKS_FILTERS` |
| `src/features/kependudukan/statistik/application/statistik-kependudukan-use-cases.ts` | `normalkanKategori` |
| `src/features/kependudukan/statistik/domain/kelompok-rentan.ts` | `totalPendudukBaris`, `jumlahDisabilitasBaris` |
| `src/features/kependudukan/statistik/domain/statistik-kependudukan.ts` | `STATISTIK_KATEGORI` |
| `src/features/keuangan-desa/keuangan/application/keuangan-use-cases.ts` | `defaultTahun` |
| `src/features/keuangan-desa/keuangan/domain/apbdes-import.ts` | `apbdesTemplateRowSchema`, `validateApbdesRow` |
| `src/features/keuangan-desa/keuangan/domain/keuangan.ts` | `EXCLUDED_AKUN` |
| `src/features/keuangan-desa/keuangan/domain/laporan-dokumen.ts` | `LAPORAN_TIPE_OPTIONS` |
| `src/features/keuangan-desa/keuangan/domain/pembukuan.ts` | `PEMBUKUAN_JENIS` |
| `src/features/keuangan-desa/keuangan/domain/sisa-lebih.ts` | `normalisasiJumlahSisaLebih` |
| `src/features/keuangan-desa/keuangan/infrastructure/laporan-storage.ts` | `jalurAbsolutLaporan` |
| `src/features/layanan-warga/kontak/domain/kontak.ts` | `GRUP_KONTAK_RESOURCE` |
| `src/features/layanan-warga/lapak/domain/lapak.ts` | `lapakWargaSchema` |
| `src/features/layanan-warga/lapak/infrastructure/lapak-repository.ts` | `LAPAK_PAGE_SIZE` |
| `src/features/layanan-warga/pelanggan/domain/pelanggan.ts` | `MIME_DOKUMEN_KERJASAMA` |
| `src/features/layanan-warga/pelayanan/domain/pengajuan.ts` | `STATUS_PENGAJUAN_LAYANAN`, `TRANSISI_PENGAJUAN` |
| `src/features/layanan-warga/pendapat/domain/pendapat-berkas.ts` | `labelPilihan` |
| `src/features/layanan-warga/pengaduan/domain/pengaduan.ts` | `ISI_MAX`, `NAMA_MAX`, `ALAMAT_MAX`, `TELEPON_MAX`, `EMAIL_MAX`, `TANGGAPAN_MAX` |
| `src/features/layanan-warga/pesan-warga/domain/pesan-warga.ts` | `PENGIRIM_PESAN` |
| `src/features/layanan-warga/survey/domain/survey-csv.ts` | `KOLOM_AWAL` |
| `src/features/layanan-warga/survey/domain/survey.ts` | `TIPE_SOAL`, `DESKRIPSI_MAX`, `PERTANYAAN_MAX`, `PILIHAN_MIN`, `PILIHAN_MAX`, `NAMA_RESPONDEN_MAX`, `SASARAN_MAX`, `BOBOT_MIN`, `BOBOT_MAX`, `parseSkorPilihanForm`, `serializeSkorPilihan`, `REKAP_TEKS_MAKS` |
| `src/features/layanan-warga/umpan-balik/domain/umpan-balik.ts` | `UMPAN_BALIK_STATUS`, `UMPAN_BALIK_STATUS_LABELS` |
| `src/features/media/domain/media.ts` | `KATEGORI_MEDIA_PUBLIK`, `MIME_SYARAT_PERMOHONAN` |
| `src/features/media/infrastructure/media-storage.ts` | `jalurRelatifMedia`, `jalurAbsolutMedia` |
| `src/features/multi-desa/application/audit-platform-use-cases.ts` | `BATAS_EKSPOR_AUDIT` |
| `src/features/multi-desa/application/pengguna-platform-use-cases.ts` | `penggunaPlatformBaruSchema` |
| `src/features/multi-desa/domain/paket-langganan.ts` | `STATUS_PAKET`, `STATUS_VERSI_PAKET` |
| `src/features/multi-desa/domain/sandi-sementara.ts` | `PANJANG_SANDI_SEMENTARA` |
| `src/features/multi-desa/domain/template-website.ts` | `STATUS_TEMPLATE` |
| `src/features/multi-desa/infrastructure/pemeriksa-host.ts` | `normalisasiHostDomain` |
| `src/features/multi-desa/presentation/detail-domain-overview.tsx` | `StatusDomainCard` |
| `src/features/notifikasi/domain/notifikasi.ts` | `KANAL_NOTIFIKASI`, `STATUS_NOTIFIKASI` |
| `src/features/pelayanan-persuratan/layanan-mandiri/domain/dokumen-warga.ts` | `jenisDokumenWargaSchema` |
| `src/features/pelayanan-persuratan/layanan-mandiri/domain/layanan-mandiri.ts` | `PERMOHONAN_TRANSITIONS`, `permohonanSuratFormSchema` |
| `src/features/pelayanan-persuratan/surat/application/bersama.ts` | `toAnggotaKeluarga`, `terapkanKodeKosong` |
| `src/features/pelayanan-persuratan/surat/domain/isian.ts` | `ISIAN_TIPES`, `isianFieldSchema`, `RESERVED_ISIAN_KODES` |
| `src/features/pelayanan-persuratan/surat/domain/pengikut.ts` | `PENGIKUT_PLACEHOLDER_CODES` |
| `src/features/pelayanan-persuratan/surat/domain/surat.ts` | `VERIFICATION_STATUS`, `padNomorUrut`, `NILAI_SATUAN_MASA_BERLAKU`, `LAMPIRAN_NAMA_MAKS`, `daftarLampiranValid`, `VERIFICATION_TOKEN_BYTES` |
| `src/features/pelayanan-persuratan/surat/domain/terbilang.ts` | `BATAS_TERBILANG` |
| `src/features/pelayanan-persuratan/surat/domain/tte.ts` | `konfigTteTersimpanSchema` |
| `src/features/pelayanan-persuratan/surat/domain/varian-cetak.ts` | `VARIAN_CETAK` |
| `src/features/pembangunan-aset/inventaris/domain/inventaris.ts` | `MUTASI_STEP_ROLE_SLUGS` |
| `src/features/pembangunan-aset/pembangunan/domain/pembangunan.ts` | `STATUS_PEMBANGUNAN_LABELS` |
| `src/features/pengaturan/database/domain/database.ts` | `BACKUP_EXT`, `BACKUP_GZIP_EXT` |
| `src/features/pengaturan/pengaturan/domain/pengaturan.ts` | `PETA_KUNCI` |
| `src/features/pengaturan/rbac/application/authorization.ts` | `SUPERADMIN_SLUG` |
| `src/features/pengaturan/rbac/domain/permission.ts` | `ACCESS_RANK` |
| `src/features/pertanahan-gis/gis/domain/gis.ts` | `POLYGON_TIPE` |
| `src/features/program-data-desa/bantuan/domain/bantuan.ts` | `ASAL_DANA_BANTUAN` |
| `src/features/program-data-desa/idm/domain/idm.ts` | `idmFormSchema`, `IDM_STATUS`, `sdgsFormSchema` |
| `src/features/program-data-desa/sinergi/domain/sinergi.ts` | `SINERGI_CSV_HEADERS` |
| `src/features/warga/domain/verifikasi-kontak.ts` | `PANJANG_KODE` |
| `src/lib/public-paths.ts` | `PUBLIC_PATHS`, `PUBLIC_EXACT_PATHS`, `PUBLIC_FILES`, `PUBLIC_DYNAMIC_PATHS` |
| `src/lib/spreadsheet.ts` | `EKSTENSI_IMPOR` |
